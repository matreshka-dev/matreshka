import { InjectionToken } from '@angular/core';
import { Request } from 'express';

export const REQUEST = new InjectionToken<Request>('REQUEST');
