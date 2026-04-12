import { getServiceBySlug } from '../../../lib/get-public-data';
import ServiceDetailClient from './ServiceDetailClient';

export const revalidate = 60;

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  return <ServiceDetailClient service={service} />;
}
