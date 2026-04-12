import { getDoctors } from '../../lib/get-public-data';
import DoctorsClient from './DoctorsClient';

export const revalidate = 60;

export default async function DoctorsPage() {
  const doctors = await getDoctors(20);
  return <DoctorsClient doctors={doctors} />;
}
