#!/bin/sh

VSERSION=$(npm view mongo-realtime-client version)
npm run bundle

gsutil cp ./dist/mongo-realtime.js gs://mongo-realtime/cdn/
gsutil cp ./dist/mongo-realtime.js.map gs://mongo-realtime/cdn/

gsutil cp ./dist/mongo-realtime.js gs://mongo-realtime/cdn/${VSERSION}/
gsutil cp ./dist/mongo-realtime.js.map gs://mongo-realtime/cdn/${VSERSION}/
