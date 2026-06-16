-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroVideo" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "blobUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Showreel" (
    "showreelId" TEXT NOT NULL DEFAULT 'showreelId',
    "showreelUrl" TEXT NOT NULL DEFAULT '',
    "videoType" TEXT NOT NULL DEFAULT 'url',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Showreel_pkey" PRIMARY KEY ("showreelId")
);
