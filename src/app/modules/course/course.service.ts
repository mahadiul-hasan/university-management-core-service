/* eslint-disable @typescript-eslint/no-explicit-any */
import { Course, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { asyncForEach } from '../../../shared/utils';
import { courseSearchableFields } from './course.constant';
import {
  ICourseCreateData,
  ICourseFilterRequest,
  IPrerequisiteCourseRequest,
} from './course.interface';

const insertIntoDB = async (data: ICourseCreateData): Promise<any> => {
  const { preRequisiteCourses, ...courseData } = data;

  const newCourse = await prisma.$transaction(async transactionClient => {
    const result = await transactionClient.course.create({
      data: courseData,
    });

    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to create course');
    }

    if (preRequisiteCourses && preRequisiteCourses.length > 0) {
      await asyncForEach(
        preRequisiteCourses,
        async (preRequisiteCourse: IPrerequisiteCourseRequest) => {
          await transactionClient.courseToPrerequisite.create({
            data: {
              courseId: result.id,
              preRequisiteId: preRequisiteCourse.courseId,
            },
          });
        }
      );
    }
    return result;
  });

  if (newCourse) {
    const responseData = await prisma.course.findUnique({
      where: {
        id: newCourse.id,
      },
      include: {
        preRequisite: {
          include: {
            preRequisite: true,
          },
        },
        preRequisiteFor: {
          include: {
            course: true,
          },
        },
      },
    });

    return responseData;
  }

  throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to create course');
};

const getAllFromDB = async (
  filters: ICourseFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Course[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: courseSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({
        [key]: {
          equals: (filterData as any)[key].toLowerCase(),
          mode: 'insensitive',
        },
      })),
    });
  }

  const whereConditions: Prisma.CourseWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.course.findMany({
    include: {
      preRequisite: {
        include: {
          preRequisite: true,
        },
      },
      preRequisiteFor: {
        include: {
          course: true,
        },
      },
    },
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: 'desc',
          },
  });

  const total = await prisma.course.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getDataById = async (id: string): Promise<Course | null> => {
  const result = await prisma.course.findUnique({
    where: {
      id,
    },
    include: {
      preRequisite: {
        include: {
          preRequisite: true,
        },
      },
      preRequisiteFor: {
        include: {
          course: true,
        },
      },
    },
  });

  return result;
};

const updateOneInDB = async (
  id: string,
  payload: ICourseCreateData
): Promise<Course | null> => {
  const { preRequisiteCourses, ...courseData } = payload;

  const updatedCourse = await prisma.$transaction(async transactionClient => {
    const result = await transactionClient.course.update({
      where: {
        id,
      },
      data: courseData,
    });

    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to update course');
    }

    // Remove existing prerequisites for the course
    await transactionClient.courseToPrerequisite.deleteMany({
      where: {
        courseId: result.id,
      },
    });

    // Create new prerequisites if provided
    if (preRequisiteCourses && preRequisiteCourses.length > 0) {
      await asyncForEach(
        preRequisiteCourses,
        async (preRequisiteCourse: IPrerequisiteCourseRequest) => {
          await transactionClient.courseToPrerequisite.create({
            data: {
              courseId: result.id,
              preRequisiteId: preRequisiteCourse.courseId,
            },
          });
        }
      );
    }

    return result;
  });

  if (updatedCourse) {
    const responseData = await prisma.course.findUnique({
      where: {
        id: updatedCourse.id,
      },
      include: {
        preRequisite: {
          include: {
            preRequisite: true,
          },
        },
        preRequisiteFor: {
          include: {
            course: true,
          },
        },
      },
    });

    return responseData;
  }

  throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to update course');

  //   const { preRequisiteCourses, ...courseData } = payload;

  //   await prisma.$transaction(async transactionClient => {
  //     const result = await transactionClient.course.update({
  //       where: {
  //         id,
  //       },
  //       data: courseData,
  //     });

  //     if (!result) {
  //       throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to update course');
  //     }

  //     if (preRequisiteCourses && preRequisiteCourses.length > 0) {
  //       const deletePrerequisite = preRequisiteCourses.filter(
  //         coursePrerequisite =>
  //           coursePrerequisite.courseId && coursePrerequisite.isDeleted
  //       );

  //       const newPrerequisite = preRequisiteCourses.filter(
  //         coursePrerequisite =>
  //           coursePrerequisite.courseId && !coursePrerequisite.isDeleted
  //       );

  //       await asyncForEach(
  //         deletePrerequisite,
  //         async (deletePreCourse: IPrerequisiteCourseRequest) => {
  //           await transactionClient.courseToPrerequisite.deleteMany({
  //             where: {
  //               AND: [
  //                 {
  //                   courseId: id,
  //                 },
  //                 {
  //                   preRequisiteId: deletePreCourse.courseId,
  //                 },
  //               ],
  //             },
  //           });
  //         }
  //       );

  //       await asyncForEach(
  //         newPrerequisite,
  //         async (insertPrerequisite: IPrerequisiteCourseRequest) => {
  //           await transactionClient.courseToPrerequisite.create({
  //             data: {
  //               courseId: id,
  //               preRequisiteId: insertPrerequisite.courseId,
  //             },
  //           });
  //         }
  //       );
  //     }

  //     return result;
  //   });

  //   const responseData = await prisma.course.findUnique({
  //     where: {
  //       id,
  //     },
  //     include: {
  //       preRequisite: {
  //         include: {
  //           preRequisite: true,
  //         },
  //       },
  //       preRequisiteFor: {
  //         include: {
  //           course: true,
  //         },
  //       },
  //     },
  //   });

  //   return responseData;
};

const deleteFromDB = async (id: string): Promise<Course> => {
  await prisma.courseToPrerequisite.deleteMany({
    where: {
      OR: [
        {
          courseId: id,
        },
        {
          preRequisiteId: id,
        },
      ],
    },
  });

  const result = await prisma.course.delete({
    where: {
      id,
    },
  });
  return result;
};

export const CourseService = {
  insertIntoDB,
  getAllFromDB,
  getDataById,
  updateOneInDB,
  deleteFromDB,
};
