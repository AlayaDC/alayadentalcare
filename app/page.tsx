import { getDoctors, getServices, getSiteContent } from '../lib/get-public-data';
import HomeClient from './HomeClient';

export const revalidate = 60; // revalidate data every 60 seconds

export default async function HomePage() {
  const [doctors, services, siteContent] = await Promise.all([
    getDoctors(4),
    getServices(6),
    getSiteContent(),
  ]);

  return (
    <HomeClient
      initialDoctors={doctors}
      initialServices={services}
      siteContent={siteContent}
    />
  );
}
