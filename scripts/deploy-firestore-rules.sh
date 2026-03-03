#!/bin/bash
echo "Deploying Firestore Rules..."
firebase deploy --only firestore:rules
