/*
  Warnings:

  - You are about to drop the `OfferedCourseSection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OfferedCourseSection" DROP CONSTRAINT "OfferedCourseSection_offeredCourseId_fkey";

-- DropForeignKey
ALTER TABLE "OfferedCourseSection" DROP CONSTRAINT "OfferedCourseSection_semesterRegistrationId_fkey";

-- DropTable
DROP TABLE "OfferedCourseSection";

-- CreateTable
CREATE TABLE "offered_course_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "currentlyEnrolledStudent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offeredCourseId" TEXT NOT NULL,
    "semesterRegistrationId" TEXT NOT NULL,

    CONSTRAINT "offered_course_sections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "offered_course_sections" ADD CONSTRAINT "offered_course_sections_offeredCourseId_fkey" FOREIGN KEY ("offeredCourseId") REFERENCES "offered_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offered_course_sections" ADD CONSTRAINT "offered_course_sections_semesterRegistrationId_fkey" FOREIGN KEY ("semesterRegistrationId") REFERENCES "semester_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
