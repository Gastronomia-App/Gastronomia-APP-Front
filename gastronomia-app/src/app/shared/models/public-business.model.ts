export interface PublicBusiness {
  id: number;
  name: string;
  slug: string;
  phoneNumber?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressZipCode?: string | null;
  addressProvince?: string | null;
}