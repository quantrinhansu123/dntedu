/**
 * Data Integrity Service
 * Handles cascading updates, validation, and consistency checks
 */

// import {
//   collection,
//   doc,
//   query,
//   where,

// ============================================
// 1. CASCADING OPERATIONS
// ============================================

/**
 * Cascade update when a class is deleted
 * - Updates all students with this classId to null
 * - Updates all work sessions references
 */
export const cascadeDeleteClass = async (classId: string, className?: string): Promise<{
  studentsUpdated: number;
  workSessionsUpdated: number;
  attendanceDeleted: number;
}> => {
  let studentsUpdated = 0;
  let workSessionsUpdated = 0;
  let attendanceDeleted = 0;

  // Update students
  );
  studentsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      classId: null,
      className: null,
      class: null,
    });
    studentsUpdated++;
  });

  // Also check students by className (legacy field)
  if (className) {
    );
    studentsByNameSnap.forEach((docSnap) => {
      if (!studentsSnap.docs.find(d => d.id === docSnap.id)) {
        batch.update(docSnap.ref, {
          classId: null,
          className: null,
          class: null,
        });
        studentsUpdated++;
      }
    });
  }

  // Update work sessions
  );
  workSessionsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      classId: null,
      className: '[Lớp đã xóa]',
    });
    workSessionsUpdated++;
  });

  // Delete attendance records for this class
  );
  for (const docSnap of attendanceSnap.docs) {
    // Delete student attendance records first
    );
    studentAttendanceSnap.forEach((saDoc) => {
      batch.delete(saDoc.ref);
    });
    // Delete main attendance record
    batch.delete(docSnap.ref);
    attendanceDeleted++;
  }

  await batch.commit();

  return { studentsUpdated, workSessionsUpdated, attendanceDeleted };
};

/**
 * Cascade update when a parent is updated
 * - Syncs parentName and parentPhone to all children (students)
 */
export const cascadeUpdateParent = async (
  parentId: string,
  updates: { name?: string; phone?: string }
): Promise<number> => {
  let studentsUpdated = 0;

  );

  studentsSnap.forEach((docSnap) => {
    const updateData: any = {};
    if (updates.name) updateData.parentName = updates.name;
    if (updates.phone) updateData.parentPhone = updates.phone;

    if (Object.keys(updateData).length > 0) {
      batch.update(docSnap.ref, updateData);
      studentsUpdated++;
    }
  });

  if (studentsUpdated > 0) {
    await batch.commit();
  }

  return studentsUpdated;
};

/**
 * Cascade update when a staff (teacher) is deleted
 * - Updates all classes with this teacherId
 */
export const cascadeDeleteStaff = async (staffId: string): Promise<{
  classesUpdated: number;
  workSessionsUpdated: number;
}> => {
  let classesUpdated = 0;
  let workSessionsUpdated = 0;

  // Update classes where this staff is teacher
  );
  classesTeacherSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      teacherId: null,
      teacher: '[Giáo viên đã xóa]',
    });
    classesUpdated++;
  });

  // Update work sessions
  );
  workSessionsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      staffId: null,
      staffName: '[Nhân viên đã xóa]',
    });
    workSessionsUpdated++;
  });

  await batch.commit();

  return { classesUpdated, workSessionsUpdated };
};

/**
 * Cascade update when class name changes
 * - Updates className in all students
 */
export const cascadeUpdateClassName = async (
  classId: string,
  newClassName: string
): Promise<number> => {
  let studentsUpdated = 0;

  );

  studentsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      className: newClassName,
      class: newClassName,
    });
    studentsUpdated++;
  });

  if (studentsUpdated > 0) {
    await batch.commit();
  }

  return studentsUpdated;
};

// ============================================
// 2. VALIDATION BEFORE DELETE
// ============================================

export interface ValidationResult {
  canDelete: boolean;
  reason?: string;
  relatedCount?: number;
  relatedItems?: string[];
}

/**
 * Validate before deleting a class
 */
export const validateDeleteClass = async (classId: string): Promise<ValidationResult> => {
  // Check for students in this class
  );

  if (studentsSnap.size > 0) {
    const studentNames = studentsSnap.docs
      .slice(0, 5)
      .map(d => d.data().fullName || d.data().name);
    
    return {
      canDelete: false,
      reason: `Lớp học đang có ${studentsSnap.size} học viên. Vui lòng chuyển học viên sang lớp khác trước khi xóa.`,
      relatedCount: studentsSnap.size,
      relatedItems: studentNames,
    };
  }

  // Check for upcoming work sessions
  const today = new Date().toISOString().split('T')[0];
  );

  if (workSessionsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Lớp học còn ${workSessionsSnap.size} buổi dạy chưa hoàn thành.`,
      relatedCount: workSessionsSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Validate before deleting a parent
 */
export const validateDeleteParent = async (parentId: string): Promise<ValidationResult> => {
  );

  if (studentsSnap.size > 0) {
    const studentNames = studentsSnap.docs
      .slice(0, 5)
      .map(d => d.data().fullName || d.data().name);

    return {
      canDelete: false,
      reason: `Phụ huynh có ${studentsSnap.size} học viên liên kết. Vui lòng cập nhật thông tin học viên trước.`,
      relatedCount: studentsSnap.size,
      relatedItems: studentNames,
    };
  }

  return { canDelete: true };
};

/**
 * Validate before deleting a staff member
 */
export const validateDeleteStaff = async (staffId: string): Promise<ValidationResult> => {
  // Check if teaching any classes
  );

  if (classesSnap.size > 0) {
    const classNames = classesSnap.docs
      .slice(0, 5)
      .map(d => d.data().name);

    return {
      canDelete: false,
      reason: `Nhân viên đang phụ trách ${classesSnap.size} lớp học. Vui lòng chuyển lớp cho giáo viên khác trước.`,
      relatedCount: classesSnap.size,
      relatedItems: classNames,
    };
  }

  // Check for pending work sessions
  );

  if (workSessionsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Nhân viên còn ${workSessionsSnap.size} buổi dạy chờ xác nhận.`,
      relatedCount: workSessionsSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Validate before deleting a student
 */
export const validateDeleteStudent = async (studentId: string): Promise<ValidationResult> => {
  // Check for unpaid contracts
  );

  if (contractsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Học viên còn ${contractsSnap.size} hợp đồng chưa thanh toán.`,
      relatedCount: contractsSnap.size,
    };
  }

  return { canDelete: true };
};

// ============================================
// 3. DATA CONSISTENCY CHECK
// ============================================

export interface ConsistencyIssue {
  type: 'orphaned_reference' | 'data_mismatch' | 'missing_field';
  collection: string;
  documentId: string;
  field: string;
  currentValue: any;
  expectedValue?: any;
  description: string;
}

export interface ConsistencyReport {
  checkedAt: string;
  totalIssues: number;
  issues: ConsistencyIssue[];
  summary: {
    orphanedReferences: number;
    dataMismatches: number;
    missingFields: number;
  };
}

/**
 * Check data consistency across all collections
 */
export const checkDataConsistency = async (): Promise<ConsistencyReport> => {
  const issues: ConsistencyIssue[] = [];

  // Fetch all data
  const [studentsSnap, classesSnap, parentsSnap, staffSnap] = await Promise.all([
      //   ]);

  const classesMap = new Map(classesSnap.docs.map(d => [d.id, d.data()]));
  const parentsMap = new Map(parentsSnap.docs.map(d => [d.id, d.data()]));
  const staffMap = new Map(staffSnap.docs.map(d => [d.id, d.data()]));

  // Check students
  for (const docSnap of studentsSnap.docs) {
    const student = docSnap.data();
    const studentId = docSnap.id;

    // Check orphaned classId
    if (student.classId && !classesMap.has(student.classId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'classId',
        currentValue: student.classId,
        description: `Student "${student.fullName || student.name}" references non-existent class`,
      });
    }

    // Check orphaned parentId
    if (student.parentId && !parentsMap.has(student.parentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'parentId',
        currentValue: student.parentId,
        description: `Student "${student.fullName || student.name}" references non-existent parent`,
      });
    }

    // Check parentName mismatch
    if (student.parentId && parentsMap.has(student.parentId)) {
      const parent = parentsMap.get(student.parentId);
      if (parent?.name && student.parentName && parent.name !== student.parentName) {
        issues.push({
          type: 'data_mismatch',
          collection: 'students',
          documentId: studentId,
          field: 'parentName',
          currentValue: student.parentName,
          expectedValue: parent.name,
          description: `Student "${student.fullName}" has mismatched parentName`,
        });
      }
    }

    // Check className mismatch
    if (student.classId && classesMap.has(student.classId)) {
      const cls = classesMap.get(student.classId);
      if (cls?.name && student.className && cls.name !== student.className) {
        issues.push({
          type: 'data_mismatch',
          collection: 'students',
          documentId: studentId,
          field: 'className',
          currentValue: student.className,
          expectedValue: cls.name,
          description: `Student "${student.fullName}" has mismatched className`,
        });
      }
    }

    // Check missing required fields
    if (!student.fullName && !student.name) {
      issues.push({
        type: 'missing_field',
        collection: 'students',
        documentId: studentId,
        field: 'fullName',
        currentValue: null,
        description: `Student ${studentId} is missing name`,
      });
    }
  }

  // Check classes
  for (const docSnap of classesSnap.docs) {
    const cls = docSnap.data();
    const classId = docSnap.id;

    // Check orphaned teacherId
    if (cls.teacherId && !staffMap.has(cls.teacherId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'classes',
        documentId: classId,
        field: 'teacherId',
        currentValue: cls.teacherId,
        description: `Class "${cls.name}" references non-existent teacher`,
      });
    }
  }

  // Generate summary
  const summary = {
    orphanedReferences: issues.filter(i => i.type === 'orphaned_reference').length,
    dataMismatches: issues.filter(i => i.type === 'data_mismatch').length,
    missingFields: issues.filter(i => i.type === 'missing_field').length,
  };

  return {
    checkedAt: new Date().toISOString(),
    totalIssues: issues.length,
    issues,
    summary,
  };
};

/**
 * Auto-fix consistency issues
 */
export const fixConsistencyIssues = async (issues: ConsistencyIssue[]): Promise<{
  fixed: number;
  failed: number;
  errors: string[];
}> => {
  let fixed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const issue of issues) {
    try {

      if (issue.type === 'orphaned_reference') {
        // Clear orphaned references
      //           [issue.field]: null,
      //         });
        fixed++;
      } else if (issue.type === 'data_mismatch' && issue.expectedValue !== undefined) {
        // Fix data mismatch
      //           [issue.field]: issue.expectedValue,
      //         });
        fixed++;
      }
      // Skip missing_field - needs manual intervention
    } catch (err: any) {
      failed++;
      errors.push(`Failed to fix ${issue.collection}/${issue.documentId}: ${err.message}`);
    }
  }

  return { fixed, failed, errors };
};

// ============================================
// HR MODULE - STAFF INTEGRITY
// ============================================

/**
 * Cascade update when staff name changes
 * - Syncs teacher name to all classes
 * - Syncs staffName to all work sessions
 */
export const cascadeUpdateStaffName = async (
  staffId: string,
  newName: string
): Promise<{ classesUpdated: number; workSessionsUpdated: number }> => {
  let classesUpdated = 0;
  let workSessionsUpdated = 0;

  // Update classes where this staff is teacher
  );
  classesSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { teacher: newName });
    classesUpdated++;
  });

  // Update classes where this staff is assistant
  );
  assistantSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { assistant: newName });
    classesUpdated++;
  });

  // Update work sessions
  );
  workSessionsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { staffName: newName });
    workSessionsUpdated++;
  });

  if (classesUpdated > 0 || workSessionsUpdated > 0) {
    await batch.commit();
  }

  return { classesUpdated, workSessionsUpdated };
};

// ============================================
// FINANCE MODULE - CONTRACT/INVOICE INTEGRITY
// ============================================

/**
 * Validate before deleting a student (Finance check)
 */
export const validateDeleteStudentFinance = async (studentId: string): Promise<ValidationResult> => {
  // Check for unpaid contracts
  );
  
  const unpaidContracts = contractsSnap.docs.filter(d => {
    const data = d.data();
    return data.status === 'Nợ phí' || data.status === 'Nháp' || data.remainingAmount > 0;
  });

  if (unpaidContracts.length > 0) {
    return {
      canDelete: false,
      reason: `Học viên còn ${unpaidContracts.length} hợp đồng chưa thanh toán đầy đủ.`,
      relatedCount: unpaidContracts.length,
    };
  }

  // Check for invoices
  );

  if (invoicesSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Học viên còn ${invoicesSnap.size} hóa đơn chưa thanh toán.`,
      relatedCount: invoicesSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Cascade when deleting a student (mark contracts/invoices)
 */
export const cascadeDeleteStudent = async (studentId: string, studentName?: string): Promise<{
  contractsUpdated: number;
  invoicesUpdated: number;
  attendanceDeleted: number;
}> => {
  let contractsUpdated = 0;
  let invoicesUpdated = 0;
  let attendanceDeleted = 0;

  // Update contracts
  );
  contractsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      studentId: null,
      studentName: studentName ? `[Đã xóa] ${studentName}` : '[Học viên đã xóa]',
    });
    contractsUpdated++;
  });

  // Update invoices
  );
  invoicesSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      studentId: null,
      studentName: studentName ? `[Đã xóa] ${studentName}` : '[Học viên đã xóa]',
    });
    invoicesUpdated++;
  });

  // Delete attendance records
  );
  attendanceSnap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
    attendanceDeleted++;
  });

  if (contractsUpdated > 0 || invoicesUpdated > 0 || attendanceDeleted > 0) {
    await batch.commit();
  }

  return { contractsUpdated, invoicesUpdated, attendanceDeleted };
};

/**
 * Validate before deleting a contract
 */
export const validateDeleteContract = async (contractId: string): Promise<ValidationResult> => {
  if (!contractDoc.exists()) {
    return { canDelete: true };
  }

  const contract = contractDoc.data();
  
  // Check if contract has payments
  if (contract.paidAmount > 0) {
    return {
      canDelete: false,
      reason: `Hợp đồng đã có thanh toán ${contract.paidAmount?.toLocaleString()}đ. Không thể xóa.`,
      relatedCount: 1,
    };
  }

  return { canDelete: true };
};

// ============================================
// ROOM INTEGRITY
// ============================================

/**
 * Validate before deleting a room
 */
export const validateDeleteRoom = async (roomId: string, roomName?: string): Promise<ValidationResult> => {
  // Check if any class uses this room
  );

  if (classesSnap.size > 0) {
    const classNames = classesSnap.docs.slice(0, 5).map(d => d.data().name);
    return {
      canDelete: false,
      reason: `Phòng học đang được sử dụng bởi ${classesSnap.size} lớp học.`,
      relatedCount: classesSnap.size,
      relatedItems: classNames,
    };
  }

  return { canDelete: true };
};

/**
 * Cascade when deleting a room
 */
export const cascadeDeleteRoom = async (roomName: string): Promise<number> => {
  let classesUpdated = 0;

  );
  
  classesSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { room: null });
    classesUpdated++;
  });

  if (classesUpdated > 0) {
    await batch.commit();
  }

  return classesUpdated;
};

/**
 * Validate before deleting salary config
 */
export const validateDeleteSalaryConfig = async (configId: string): Promise<ValidationResult> => {
  if (!configDoc.exists()) {
    return { canDelete: true };
  }

  const config = configDoc.data();
  
  // Check if any staff uses this config
  );

  if (staffSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Cấu hình lương đang được áp dụng cho ${staffSnap.size} nhân viên với vị trí "${config.position}".`,
      relatedCount: staffSnap.size,
    };
  }

  return { canDelete: true };
};

// ============================================
// SALES MODULE - LEAD/CAMPAIGN INTEGRITY
// ============================================

/**
 * Validate before deleting a campaign
 */
export const validateDeleteCampaign = async (campaignId: string): Promise<ValidationResult> => {
  );

  if (leadsSnap.size > 0) {
    return {
      canDelete: false,
      reason: `Chiến dịch có ${leadsSnap.size} leads liên kết. Vui lòng xóa hoặc chuyển leads trước.`,
      relatedCount: leadsSnap.size,
    };
  }

  return { canDelete: true };
};

/**
 * Cascade when deleting a campaign
 */
export const cascadeDeleteCampaign = async (campaignId: string): Promise<number> => {
  let leadsUpdated = 0;

  );

  leadsSnap.forEach((docSnap) => {
    batch.update(docSnap.ref, { 
      campaignId: null,
      campaignName: '[Chiến dịch đã xóa]'
    });
    leadsUpdated++;
  });

  if (leadsUpdated > 0) {
    await batch.commit();
  }

  return leadsUpdated;
};

/**
 * Validate before deleting a lead
 */
export const validateDeleteLead = async (leadId: string): Promise<ValidationResult> => {
  if (!leadDoc.exists()) {
    return { canDelete: true };
  }

  const lead = leadDoc.data();

  // Check if lead was converted to student
  if (lead.convertedToStudentId || lead.studentId) {
    return {
      canDelete: false,
      reason: `Lead đã được chuyển đổi thành học viên. Không thể xóa.`,
      relatedCount: 1,
    };
  }

  return { canDelete: true };
};

// ============================================
// ENHANCED CONSISTENCY CHECK
// ============================================

/**
 * Enhanced data consistency check for all modules
 */
export const checkFullDataConsistency = async (): Promise<ConsistencyReport> => {
  const issues: ConsistencyIssue[] = [];

  // Fetch all data
  const [
    studentsSnap, 
    classesSnap, 
    parentsSnap, 
    staffSnap,
    contractsSnap,
    invoicesSnap,
    workSessionsSnap,
    leadsSnap,
    campaignsSnap
  ] = await Promise.all([
  ]);

  // Create lookup maps
  const classesMap = new Map(classesSnap.docs.map(d => [d.id, d.data()]));
  const parentsMap = new Map(parentsSnap.docs.map(d => [d.id, d.data()]));
  const staffMap = new Map(staffSnap.docs.map(d => [d.id, d.data()]));
  const studentsMap = new Map(studentsSnap.docs.map(d => [d.id, d.data()]));
  const campaignsMap = new Map(campaignsSnap.docs.map(d => [d.id, d.data()]));
  // const roomNames = new Set(roomsSnap.docs.map(d => d.data().name || d.data().roomName)); // Đã xóa quản lý phòng học
  const roomNames = new Set<string>(); // Tạm thời empty set

  // Check students (existing logic)
  for (const docSnap of studentsSnap.docs) {
    const student = docSnap.data();
    const studentId = docSnap.id;

    if (student.classId && !classesMap.has(student.classId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'classId',
        currentValue: student.classId,
        description: `Student "${student.fullName || student.name}" references non-existent class`,
      });
    }

    if (student.parentId && !parentsMap.has(student.parentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'students',
        documentId: studentId,
        field: 'parentId',
        currentValue: student.parentId,
        description: `Student "${student.fullName || student.name}" references non-existent parent`,
      });
    }
  }

  // Check classes
  for (const docSnap of classesSnap.docs) {
    const cls = docSnap.data();
    const classId = docSnap.id;

    if (cls.teacherId && !staffMap.has(cls.teacherId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'classes',
        documentId: classId,
        field: 'teacherId',
        currentValue: cls.teacherId,
        description: `Class "${cls.name}" references non-existent teacher`,
      });
    }

    if (cls.assistantId && !staffMap.has(cls.assistantId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'classes',
        documentId: classId,
        field: 'assistantId',
        currentValue: cls.assistantId,
        description: `Class "${cls.name}" references non-existent assistant`,
      });
    }

    // Check room exists - Đã xóa quản lý phòng học
    // if (cls.room && !roomNames.has(cls.room)) {
    //   issues.push({
    //     type: 'orphaned_reference',
    //     collection: 'classes',
    //     documentId: classId,
    //     field: 'room',
    //     currentValue: cls.room,
    //     description: `Class "${cls.name}" uses non-existent room "${cls.room}"`,
    //   });
    // }
  }

  // Check contracts
  for (const docSnap of contractsSnap.docs) {
    const contract = docSnap.data();
    const contractId = docSnap.id;

    if (contract.studentId && !studentsMap.has(contract.studentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'contracts',
        documentId: contractId,
        field: 'studentId',
        currentValue: contract.studentId,
        description: `Contract "${contract.code}" references non-existent student`,
      });
    }
  }

  // Check invoices
  for (const docSnap of invoicesSnap.docs) {
    const invoice = docSnap.data();
    const invoiceId = docSnap.id;

    if (invoice.studentId && !studentsMap.has(invoice.studentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'invoices',
        documentId: invoiceId,
        field: 'studentId',
        currentValue: invoice.studentId,
        description: `Invoice "${invoice.code}" references non-existent student`,
      });
    }
  }

  // Check work sessions
  for (const docSnap of workSessionsSnap.docs) {
    const session = docSnap.data();
    const sessionId = docSnap.id;

    if (session.staffId && !staffMap.has(session.staffId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'workSessions',
        documentId: sessionId,
        field: 'staffId',
        currentValue: session.staffId,
        description: `Work session references non-existent staff`,
      });
    }

    if (session.classId && !classesMap.has(session.classId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'workSessions',
        documentId: sessionId,
        field: 'classId',
        currentValue: session.classId,
        description: `Work session references non-existent class`,
      });
    }
  }

  // Check leads
  for (const docSnap of leadsSnap.docs) {
    const lead = docSnap.data();
    const leadId = docSnap.id;

    if (lead.campaignId && !campaignsMap.has(lead.campaignId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'leads',
        documentId: leadId,
        field: 'campaignId',
        currentValue: lead.campaignId,
        description: `Lead "${lead.name}" references non-existent campaign`,
      });
    }

    if (lead.convertedToStudentId && !studentsMap.has(lead.convertedToStudentId)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'leads',
        documentId: leadId,
        field: 'convertedToStudentId',
        currentValue: lead.convertedToStudentId,
        description: `Lead "${lead.name}" references non-existent converted student`,
      });
    }

    if (lead.assignedTo && !staffMap.has(lead.assignedTo)) {
      issues.push({
        type: 'orphaned_reference',
        collection: 'leads',
        documentId: leadId,
        field: 'assignedTo',
        currentValue: lead.assignedTo,
        description: `Lead "${lead.name}" assigned to non-existent staff`,
      });
    }
  }

  // Generate summary
  const summary = {
    orphanedReferences: issues.filter(i => i.type === 'orphaned_reference').length,
    dataMismatches: issues.filter(i => i.type === 'data_mismatch').length,
    missingFields: issues.filter(i => i.type === 'missing_field').length,
  };

  return {
    checkedAt: new Date().toISOString(),
    totalIssues: issues.length,
    issues,
    summary,
  };
};
