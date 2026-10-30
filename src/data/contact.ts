import legacyData from './data.json';

type RawContact = Partial<{
  nameEn: unknown;
  nameKa: unknown;
  addressEn: unknown;
  addressKa: unknown;
  phones: unknown;
  email: unknown;
  mapUrl: unknown;
}>;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];

const cmsEntries = import.meta.glob<RawContact>(
  '../../content/contact.json',
  { eager: true, import: 'default' },
);
const cms = Object.values(cmsEntries)[0];

function normalize(raw: RawContact) {
  const legacy = legacyData.company;
  return {
    nameEn: str(raw.nameEn) || legacy.nameEn,
    nameKa: str(raw.nameKa) || legacy.nameKa,
    addressEn: str(raw.addressEn) || legacy.addressEn,
    addressKa: str(raw.addressKa) || legacy.addressKa,
    phones: strList(raw.phones).length ? strList(raw.phones) : legacy.phones,
    email: str(raw.email) || legacy.email,
    mapUrl: str(raw.mapUrl) || legacy.mapUrl,
  };
}

export const company = cms ? normalize(cms) : legacyData.company;
export default { company };
