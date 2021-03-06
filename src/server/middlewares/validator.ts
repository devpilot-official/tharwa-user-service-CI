import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import joi, { ValidationError, AnySchema } from 'joi';
import logger from '@app/common/services/logger/logger';

const parseError = (error: ValidationError) => {
  const parsedError = error.details.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.context.key]: curr.message,
    }),
    {}
  );
  return parsedError;
};

const validate = (data: any, schema: joi.AnySchema | object) => {
  const { error, value } = joi.validate(data, schema, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (!error)
    return {
      err: null,
      value: value,
    };

  return {
    err: parseError(error),
    value: null,
  };
};

type ValidatorContext = 'body' | 'query';

export default (
  schema: AnySchema | object,
  context: ValidatorContext = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { err, value } = validate(req[context], schema);

    if (!err) {
      req[context] = value;
      return next();
    }

    res.jSend.error(
      err,
      'One or more validation errors occured',
      HttpStatus.UNPROCESSABLE_ENTITY
    );

    logger.logAPIError(req, res, err);
  };
};
