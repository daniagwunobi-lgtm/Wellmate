export interface CrisisResource {
  name: string;
  number: string;
  url: string;
  available: string;
}

export interface CountryCrisis {
  countryName: string;
  flag: string;
  resources: CrisisResource[];
}

const crisisMap: Record<string, CountryCrisis> = {
  GB: {
    countryName: "United Kingdom",
    flag: "🇬🇧",
    resources: [
      { name: "Samaritans", number: "116 123", url: "https://www.samaritans.org", available: "24/7, free" },
      { name: "Mind", number: "0300 123 3393", url: "https://www.mind.org.uk", available: "Mon–Fri 9am–6pm" },
      { name: "Crisis text line", number: "Text SHOUT to 85258", url: "https://giveusashout.org", available: "24/7" },
      { name: "NHS Mental Health Crisis", number: "111 (option 2)", url: "https://www.nhs.uk/mental-health", available: "24/7" },
    ],
  },
  US: {
    countryName: "United States",
    flag: "🇺🇸",
    resources: [
      { name: "988 Suicide & Crisis Lifeline", number: "988", url: "https://988lifeline.org", available: "24/7" },
      { name: "Crisis Text Line", number: "Text HOME to 741741", url: "https://www.crisistextline.org", available: "24/7" },
      { name: "NAMI Helpline", number: "1-800-950-6264", url: "https://www.nami.org", available: "Mon–Fri 10am–10pm ET" },
    ],
  },
  CA: {
    countryName: "Canada",
    flag: "🇨🇦",
    resources: [
      { name: "Talk Suicide Canada", number: "1-833-456-4566", url: "https://talksuicide.ca", available: "24/7" },
      { name: "Crisis Text Line", number: "Text HOME to 686868", url: "https://www.crisistextline.ca", available: "24/7" },
    ],
  },
  AU: {
    countryName: "Australia",
    flag: "🇦🇺",
    resources: [
      { name: "Lifeline", number: "13 11 14", url: "https://www.lifeline.org.au", available: "24/7" },
      { name: "Beyond Blue", number: "1300 22 4636", url: "https://www.beyondblue.org.au", available: "24/7" },
      { name: "Kids Helpline", number: "1800 55 1800", url: "https://kidshelpline.com.au", available: "24/7" },
    ],
  },
  NZ: {
    countryName: "New Zealand",
    flag: "🇳🇿",
    resources: [
      { name: "Lifeline", number: "0800 543 354", url: "https://www.lifeline.org.nz", available: "24/7" },
      { name: "Suicide Crisis Helpline", number: "0508 828 865", url: "https://www.lifeline.org.nz", available: "24/7" },
    ],
  },
  IE: {
    countryName: "Ireland",
    flag: "🇮🇪",
    resources: [
      { name: "Samaritans", number: "116 123", url: "https://www.samaritans.org/ireland", available: "24/7, free" },
      { name: "Pieta House", number: "116 123", url: "https://www.pieta.ie", available: "24/7" },
    ],
  },
  DE: {
    countryName: "Germany",
    flag: "🇩🇪",
    resources: [
      { name: "Telefonseelsorge", number: "0800 111 0 111", url: "https://www.telefonseelsorge.de", available: "24/7, free" },
    ],
  },
  FR: {
    countryName: "France",
    flag: "🇫🇷",
    resources: [
      { name: "Numéro National Prévention Suicide", number: "3114", url: "https://www.3114.fr", available: "24/7" },
    ],
  },
  IN: {
    countryName: "India",
    flag: "🇮🇳",
    resources: [
      { name: "iCall", number: "9152987821", url: "https://icallhelpline.org", available: "Mon–Sat 8am–10pm" },
      { name: "Vandrevala Foundation", number: "1860-2662-345", url: "https://www.vandrevalafoundation.com", available: "24/7" },
    ],
  },
  ZA: {
    countryName: "South Africa",
    flag: "🇿🇦",
    resources: [
      { name: "SADAG", number: "0800 456 789", url: "https://www.sadag.org", available: "24/7" },
      { name: "Lifeline SA", number: "0861 322 322", url: "https://lifelinesa.co.za", available: "24/7" },
    ],
  },
};

const INTERNATIONAL_FALLBACK: CountryCrisis = {
  countryName: "International",
  flag: "🌍",
  resources: [
    { name: "International Association for Suicide Prevention", number: "", url: "https://www.iasp.info/resources/Crisis_Centres/", available: "Find local crisis centres" },
    { name: "Befrienders Worldwide", number: "", url: "https://www.befrienders.org", available: "24/7 global network" },
  ],
};

export function getResourcesByCountry(countryCode: string): CountryCrisis {
  return crisisMap[countryCode.toUpperCase()] || INTERNATIONAL_FALLBACK;
}

export async function detectCountryCode(): Promise<string> {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "default" });
    if (!res.ok) return "GB";
    const data = await res.json();
    return data.country_code || "GB";
  } catch {
    return "GB";
  }
}
