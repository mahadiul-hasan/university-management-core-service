import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { StudentController } from './student.controller';
import { StudentValidation } from './student.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(StudentValidation.create),
  StudentController.insertIntoDB
);

router.patch(
  '/:id',
  validateRequest(StudentValidation.update),
  StudentController.updateOneInDB
);

router.delete('/:id', StudentController.deleteFromDB);

router.get('/:id', StudentController.getDataById);

router.get('/', StudentController.getAllFromDB);

export const StudentRoute = router;
