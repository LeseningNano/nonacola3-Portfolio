CREATE INDEX "Video_order_idx" ON "Video" ("order");
CREATE INDEX "Video_order_createdAt_idx" ON "Video" ("order", "createdAt");
CREATE INDEX "Video_category_idx" ON "Video" ("category");
CREATE INDEX "Post_createdAt_idx" ON "Post" ("createdAt");