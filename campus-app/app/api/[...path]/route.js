import {handle} from '../../../lib/service.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request,context){const {path}=await context.params;return handle(request,path);}
export async function POST(request,context){const {path}=await context.params;return handle(request,path);}
export async function PATCH(request,context){const {path}=await context.params;return handle(request,path);}
