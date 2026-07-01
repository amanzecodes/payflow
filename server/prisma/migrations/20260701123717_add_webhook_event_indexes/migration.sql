-- CreateIndex
CREATE INDEX "webhook_events_txRef_idx" ON "webhook_events"("txRef");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");
