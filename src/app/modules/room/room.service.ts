/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Room } from '@prisma/client';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { roomSearchableFields } from './room.constant';
import { IRoomFilterRequest } from './room.interface';

const insertIntoDB = async (data: Room): Promise<Room> => {
  const result = await prisma.room.create({
    data,
  });

  return result;
};

const getAllFromDB = async (
  filters: IRoomFilterRequest,
  options: IPaginationOptions
): Promise<IGenericResponse<Room[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: roomSearchableFields.map(field => ({
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

  const whereConditions: Prisma.RoomWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.room.findMany({
    include: {
      building: true,
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
  const total = await prisma.room.count({
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

const getDataById = async (id: string): Promise<Room | null> => {
  const result = await prisma.room.findUnique({
    where: {
      id,
    },
    include: {
      building: true,
    },
  });

  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Room>
): Promise<Room | null> => {
  const result = await prisma.room.update({
    where: {
      id,
    },
    include: {
      building: true,
    },
    data: payload,
  });

  return result;
};

const deleteFromDB = async (id: string): Promise<Room> => {
  const result = await prisma.room.delete({
    where: {
      id,
    },
  });

  return result;
};

export const RoomService = {
  insertIntoDB,
  getAllFromDB,
  getDataById,
  updateOneInDB,
  deleteFromDB,
};
