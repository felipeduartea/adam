-- CreateTable
CREATE TABLE "repos" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "local_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "repos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vector_text" (
    "id" SERIAL NOT NULL,
    "repo_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "chunk_content" TEXT NOT NULL,
    "function_name" TEXT,
    "class_name" TEXT,
    "language" TEXT NOT NULL,
    "chunk_type" TEXT NOT NULL,
    "line_start" INTEGER NOT NULL,
    "line_end" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vector_text_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repos_url_key" ON "repos"("url");

-- CreateIndex
CREATE INDEX "vector_text_repo_id_idx" ON "vector_text"("repo_id");

-- AddForeignKey
ALTER TABLE "vector_text" ADD CONSTRAINT "vector_text_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
