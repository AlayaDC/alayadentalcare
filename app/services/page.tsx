import { getServices } from '../../lib/get-public-data';
import ServicesClient from './ServicesClient';

export const revalidate = 60;

export default async function ServicesPage() {
  const services = await getServices(50);
  return <ServicesClient services={services} />;
}
