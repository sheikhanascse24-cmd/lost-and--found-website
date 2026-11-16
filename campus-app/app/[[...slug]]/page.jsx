import CampusApp from '../../components/CampusApp';
export const dynamic='force-dynamic';
export default async function Page({params}){const {slug=[]}=await params;return <CampusApp path={'/'+slug.join('/')}/>;}
