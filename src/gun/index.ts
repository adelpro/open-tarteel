'use client';
import Gun from 'gun';

import { GUNCONFIG } from '@/constants';

const gun = Gun(GUNCONFIG);

export default gun;
