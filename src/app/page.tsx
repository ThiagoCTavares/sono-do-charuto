"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3, Home as HomeIcon, Trophy, User, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Session } from "@supabase/supabase-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// --- TIPOS ---
type SleepResult = {
  totalMinutes: number;
  hours: number;
  minutes: number;
  score: number;
  label: string;
};

type SleepRecord = Database["public"]["Tables"]["registros_sono"]["Row"] & {
  perfis?: Database["public"]["Tables"]["perfis"]["Row"] | null;
};

type LeaderboardEntry = SleepRecord & {
  totalPoints: number;
  totalMinutes: number;
  nights: number;
  avgMinutes: number;
};

type AuthMode = "login" | "signup";

type AuthState = {
  email: string;
  password: string;
  mode: AuthMode;
  isSubmitting: boolean;
  error: string | null;
};

type AvatarSection =
  | "hair"
  | "hairColor"
  | "eyes"
  | "mouth"
  | "beard"
  | "beardColor"
  | "clothing"
  | "clotheColor"
  | "skin"
  | "eyebrows";

type AvatarOptions = {
  top: string;
  eyes: string;
  mouth: string;
  facialHair: string;
  facialHairColor: string;
  clothing: string;
  skinColor: string;
  hairColor: string;
  clotheColor: string;
  eyebrows: string;
};

// --- FUNÇÕES AUXILIARES ---
const bannedNicknameFragments = [
  "merda",
  "porra",
  "caralho",
  "puta",
  "bosta",
];

const validateNickname = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "O nickname não pode estar vazio.";
  }
  if (trimmed.length < 3) {
    return "Use pelo menos 3 caracteres.";
  }
  if (trimmed.length > 20) {
    return "Use no máximo 20 caracteres.";
  }

  const lower = trimmed.toLowerCase();
  const hasBanned = bannedNicknameFragments.some((word) => lower.includes(word));
  if (hasBanned) {
    return "Esse nickname não é permitido.";
  }

  return null;
};

const hairColorPalette: Record<string, string> = {
  auburn: "6E2C00",
  black: "111111",
  blonde: "FAD689",
  blondeGolden: "F5C27A",
  brown: "7A4A2A",
  brownDark: "4A2D1F",
  pastelPink: "F8BBD0",
  platinum: "E5E4E2",
  red: "D7263D",
  silverGray: "B3B3B3",
};

const clotheColorPalette: Record<string, string> = {
  black: "111111",
  blue01: "3B82F6",
  blue02: "2563EB",
  blue03: "1D4ED8",
  gray01: "6B7280",
  gray02: "374151",
  heather: "9CA3AF",
  pastelBlue: "CFFAFE",
  pastelGreen: "DCFCE7",
  pastelOrange: "FED7AA",
  pastelRed: "FECACA",
  pastelYellow: "FEF08A",
  pink: "F472B6",
  red: "EF4444",
  white: "F9FAFB",
};

const eyebrowOptions = [
  "default",
  "defaultNatural",
  "flatNatural",
  "raisedExcited",
  "raisedExcitedNatural",
  "angry",
  "angryNatural",
  "upDown",
  "upDownNatural",
];

const facialHairOptions = [
  "none",
  "beardMedium",
  "beardLight",
  "beardMajestic",
  "moustacheFancy",
  "moustacheMagnum",
];

const hairOptionLabels: Record<string, string> = {
  shortFlat: "Curto",
  shortRound: "Fofinho",
  shortCurly: "Playba",
  shortWaved: "Topete",
  theCaesar: "Raspado na 2",
  theCaesarAndSidePart: "Com traço",
  sides: "Calvo",
  bob: "Nerd",
  bun: "Coque",
  longButNotTooLong: "Claudinho",
  shaggy: "Franjola",
  shaggyMullet: "Mullet",
  frizzle: "Coco",
  bigHair: "Cabeludão",
  curly: "Grandão",
  curvy: "Franjinha",
  dreads: "Dreads",
  dreads01: "Disfarçado",
  dreads02: "Tuco",
};

const eyesOptionLabels: Record<string, string> = {
  default: "Normal",
  happy: "Gay",
  surprised: "LSD",
  closed: "Nem aí",
  squint: "Criança",
  wink: "Piscada",
  winkWacky: "Picadinha",
  cry: "Chorou",
  hearts: "Apaixonado",
  side: "Distraído",
  eyeRoll: "Quer leite",
};

const mouthOptionLabels: Record<string, string> = {
  default: "Felizin",
  smile: "Felizão",
  serious: "Boladão",
  grimace: "Cagado",
  tongue: "Quer leite",
  disbelief: "Surpreso",
  vomit: "Nojentão",
  concerned: "Embasbacado",
  eating: "Bebê",
  sad: "Triste",
  screamOpen: "Pânico",
};

const clothingOptionLabels: Record<string, string> = {
  blazerAndShirt: "Blazer",
  blazerAndSweater: "Blazer com sueter",
  collarAndSweater: "Nerdola",
  graphicShirt: "Camiseta",
  hoodie: "Moletom com capuz",
  overall: "Chucro",
  shirtCrewNeck: "Moletom careca",
  shirtScoopNeck: "Camiseta estranha",
  shirtVNeck: "Gola V",
};

const eyebrowOptionLabels: Record<string, string> = {
  default: "Fina",
  defaultNatural: "Média",
  flatNatural: "Grossa",
  raisedExcited: "Surpreso",
  raisedExcitedNatural: "Levantado",
  angry: "Puto",
  angryNatural: "Putasso",
  upDown: "Suspeita",
  upDownNatural: "Torto",
};

const facialHairOptionLabels: Record<string, string> = {
  none: "Peladinho",
  beardMedium: "Barbudo",
  beardLight: "Barba fechada",
  beardMajestic: "Lenhador",
  moustacheFancy: "Mustache",
  moustacheMagnum: "Bigode grosso",
};

const buildAvatarUrl = (nickname: string, avatarOptions: AvatarOptions) => {
  const seed = encodeURIComponent(nickname.trim() || "piloto");
  const safeTop = [
    "shortFlat",
    "shortRound",
    "shortCurly",
    "shortWaved",
    "theCaesar",
    "theCaesarAndSidePart",
    "sides",
    "bob",
    "bun",
    "longButNotTooLong",
    "shaggy",
    "shaggyMullet",
    "frizzle",
    "bigHair",
    "curly",
    "curvy",
    "dreads",
    "dreads01",
    "dreads02",
  ].includes(avatarOptions.top)
    ? avatarOptions.top
    : "shortFlat";

  const safeEyes = [
    "default",
    "happy",
    "surprised",
    "closed",
    "squint",
    "wink",
    "winkWacky",
    "cry",
    "hearts",
    "side",
    "eyeRoll",
  ].includes(avatarOptions.eyes)
    ? avatarOptions.eyes
    : "default";

  const safeMouth = [
    "default",
    "smile",
    "serious",
    "grimace",
    "tongue",
    "disbelief",
    "vomit",
    "concerned",
    "eating",
    "sad",
    "screamOpen",
  ].includes(avatarOptions.mouth)
    ? avatarOptions.mouth
    : "default";

  const safeClothing = [
    "blazerAndShirt",
    "blazerAndSweater",
    "collarAndSweater",
    "graphicShirt",
    "hoodie",
    "overall",
    "shirtCrewNeck",
    "shirtScoopNeck",
    "shirtVNeck",
  ].includes(avatarOptions.clothing)
    ? avatarOptions.clothing
    : "hoodie";

  const safeSkin = ["614335", "ae5d29", "d08b5b", "edb98a", "ffdbb4", "f8d25c"].includes(
    avatarOptions.skinColor,
  )
    ? avatarOptions.skinColor
    : "ffdbb4";

  const safeEyebrows = eyebrowOptions.includes(avatarOptions.eyebrows)
    ? avatarOptions.eyebrows
    : "default";

  const safeFacialHair =
    avatarOptions.facialHair === "none"
      ? null
      : facialHairOptions.includes(avatarOptions.facialHair)
      ? avatarOptions.facialHair
      : null;

  const safeHairColor =
    hairColorPalette[avatarOptions.hairColor] ?? hairColorPalette.brown;

  const safeFacialHairColor =
    hairColorPalette[avatarOptions.facialHairColor] ??
    hairColorPalette[avatarOptions.hairColor] ??
    hairColorPalette.brown;

  const safeClotheColor =
    clotheColorPalette[avatarOptions.clotheColor] ?? clotheColorPalette.blue01;

  const params = new URLSearchParams({
    seed,
    top: safeTop,
    eyes: safeEyes,
    mouth: safeMouth,
    clothing: safeClothing,
    skinColor: safeSkin,
    accessoriesProbability: "0",
    hairColor: safeHairColor,
    clothesColor: safeClotheColor,
    eyebrows: safeEyebrows,
  });
  if (safeFacialHair) {
    params.set("facialHair", safeFacialHair);
    params.set("facialHairProbability", "100");
    params.set("facialHairColor", safeFacialHairColor);
  } else {
    params.set("facialHairProbability", "0");
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
};

const avatarSectionTabs: { id: AvatarSection; label: string }[] = [
  { id: "hair", label: "Cabelo" },
  { id: "hairColor", label: "Cor Cabelo" },
  { id: "eyes", label: "Olhos" },
  { id: "mouth", label: "Boca" },
  { id: "beard", label: "Barba" },
  { id: "beardColor", label: "Cor Barba" },
  { id: "clothing", label: "Roupas" },
  { id: "clotheColor", label: "Cor Roupa" },
  { id: "skin", label: "Pele" },
  { id: "eyebrows", label: "Sobrancelhas" },
];

const appearanceOptionButtonBase =
  "flex flex-col items-center gap-2 px-3 py-2 text-sm font-semibold transition hover:text-slate-900 focus-visible:outline-none";
const appearancePreviewSize = 48;
const appearanceUnselectedOpacity = 0.6;
const appearanceAnimateProps = (isActive: boolean) => ({
  opacity: isActive ? 1 : appearanceUnselectedOpacity,
  y: 0,
});


const getSleepLabel = (totalMinutes: number) => {
  if (totalMinutes >= 8 * 60) return "Sono campeão";
  if (totalMinutes >= 7 * 60) return "Boa consistência";
  if (totalMinutes >= 6 * 60) return "Quase lá";
  return "Hora de recarregar";
};

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const stripSeconds = (time: string | null) => (time ? time.slice(0, 5) : "");

const normalizeTime = (time: string) =>
  time.length === 5 ? `${time}:00` : time;

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getReferenceDate = () => {
  const now = new Date();
  const reference = new Date(now);
  if (now.getHours() < 17) {
    reference.setDate(reference.getDate() - 1);
  }

  return {
    iso: formatIsoDate(reference),
    label: reference.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    }),
  };
};

const parseTimeParts = (value: string) => {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return { hours, minutes };
};

const calculateSleepDuration = (bedTime: string, wakeTime: string) => {
  if (!bedTime || !wakeTime) return null;

  const bed = parseTimeParts(bedTime);
  const wake = parseTimeParts(wakeTime);
  if (!bed || !wake) return null;

  const { hours: bedHours, minutes: bedMinutes } = bed;
  const { hours: wakeHours, minutes: wakeMinutes } = wake;

  const startMinutes = bedHours * 60 + bedMinutes;
  const endMinutes = wakeHours * 60 + wakeMinutes;

  const endMinutesAdjusted =
    endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes;
  const diff = endMinutesAdjusted - startMinutes;

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  const WINDOW_START = 20 * 60;
  const WINDOW_END = 6 * 60;
  const MINUTES_IN_DAY = 24 * 60;
  const startAbs = startMinutes;
  const endAbs = endMinutesAdjusted;

  let minutesInWindow = 0;
  const firstDay = Math.floor(startAbs / MINUTES_IN_DAY);
  const lastDay = Math.floor((endAbs - 1) / MINUTES_IN_DAY);

  for (let day = firstDay; day <= lastDay; day += 1) {
    const dayStart = day * MINUTES_IN_DAY;
    const nightStart = dayStart + WINDOW_START;
    const nightEnd = dayStart + MINUTES_IN_DAY;
    const morningStart = dayStart;
    const morningEnd = dayStart + WINDOW_END;

    const nightOverlapStart = Math.max(startAbs, nightStart);
    const nightOverlapEnd = Math.min(endAbs, nightEnd);
    if (nightOverlapEnd > nightOverlapStart) {
      minutesInWindow += nightOverlapEnd - nightOverlapStart;
    }

    const morningOverlapStart = Math.max(startAbs, morningStart);
    const morningOverlapEnd = Math.min(endAbs, morningEnd);
    if (morningOverlapEnd > morningOverlapStart) {
      minutesInWindow += morningOverlapEnd - morningOverlapStart;
    }
  }

  const minutesOutsideWindow = diff - minutesInWindow;

  const blocksInWindow = Math.ceil(minutesInWindow / 10);
  const blocksOutside = Math.ceil(minutesOutsideWindow / 10);
  const weightedPoints = blocksInWindow * 1.5 + blocksOutside;
  const score = Math.ceil(weightedPoints);

  return {
    totalMinutes: diff,
    hours,
    minutes,
    score,
    label: getSleepLabel(diff),
  } as SleepResult;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getScoreBadgeColor = (score: number) => {
  const minScore = 1;
  const maxScore = 90;
  const range = maxScore - minScore;
  const ratio = range > 0 ? (score - minScore) / range : 0.5;
  const normalized = clamp(ratio, 0, 1);
  const hue = normalized * 120;
  return `hsl(${hue} 70% 45%)`;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password: string) => password.length >= 6;

// --- COMPONENTE PRINCIPAL ---
export default function Home() {
  const supabase = useMemo<SupabaseClient<Database, "public", "public"> | null>(
    () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        return null;
      }

      return createClient<Database, "public", "public">(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    },
    [],
  );
  const [sleepStatus, setSleepStatus] = useState<"IDLE" | "SLEEPING" | "COMPLETED">(
    "IDLE"
  );
  const [activeSleepRecord, setActiveSleepRecord] = useState<{
    id: string;
    hora_deitar: string | null;
    hora_acordar: string | null;
    data_registro: string | null;
  } | null>(null);
  const [sleepStartAt, setSleepStartAt] = useState<Date | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const [referenceDate] = useState(getReferenceDate);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const referenceDay = useMemo(() => {
    const date = new Date(referenceDate.iso);
    return String(date.getDate()).padStart(2, "0");
  }, [referenceDate.iso]);
  const referenceMonth = useMemo(
    () =>
      new Date(referenceDate.iso)
        .toLocaleString("pt-BR", { month: "short" })
        .toUpperCase(),
    [referenceDate.iso]
  );
  const displayDay = useMemo(
    () => String(currentTime.getDate()).padStart(2, "0"),
    [currentTime]
  );
  const displayMonth = useMemo(
    () =>
      currentTime
        .toLocaleString("pt-BR", { month: "short" })
        .toUpperCase(),
    [currentTime]
  );
  const [registeredSummary, setRegisteredSummary] = useState<SleepResult | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"home" | "setup">("home");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBedTime, setEditBedTime] = useState("");
  const [editWakeTime, setEditWakeTime] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activeAvatarSection, setActiveAvatarSection] =
    useState<AvatarSection>("hair");
  const [showAppearanceScrollHint, setShowAppearanceScrollHint] = useState(false);
  const appearanceGridRef = useRef<HTMLDivElement | null>(null);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOptions>({
    top: "shortFlat",
    eyes: "default",
    mouth: "default",
    facialHair: "none",
    facialHairColor: "brown",
    clothing: "hoodie",
    skinColor: "ffdbb4",
    hairColor: "brown",
    clotheColor: "blue01",
    eyebrows: "default",
  });
  const [authState, setAuthState] = useState<AuthState>({
    email: "",
    password: "",
    mode: "login",
    isSubmitting: false,
    error: null,
  });

  const sleepingMetrics = useMemo(() => {
    if (sleepStatus !== "SLEEPING" || !activeSleepRecord?.hora_deitar) {
      return null;
    }
    const nowTime = formatTime(currentTime);
    return calculateSleepDuration(
      stripSeconds(activeSleepRecord.hora_deitar),
      nowTime,
    );
  }, [activeSleepRecord?.hora_deitar, currentTime, sleepStatus]);

  const sleepingDuration = useMemo(
    () =>
      sleepingMetrics ? formatDuration(sleepingMetrics.totalMinutes) : null,
    [sleepingMetrics],
  );

  const sleepingMinutes = sleepingMetrics?.totalMinutes ?? null;
  const isSleepLocked =
    sleepStatus === "SLEEPING" &&
    sleepStartAt !== null &&
    currentTime.getTime() - sleepStartAt.getTime() < 2 * 60 * 1000;

  const avatarUrl = useMemo(
    () => buildAvatarUrl(nickname, avatarOptions),
    [avatarOptions, nickname]
  );
  const bedTimeDisplay = activeSleepRecord?.hora_deitar
    ? stripSeconds(activeSleepRecord.hora_deitar)
    : "";
  const wakeTimeDisplay = activeSleepRecord?.hora_acordar
    ? stripSeconds(activeSleepRecord.hora_acordar)
    : "";
  const sleepTimeRange =
    bedTimeDisplay && wakeTimeDisplay
      ? `${bedTimeDisplay} - ${wakeTimeDisplay}`
      : null;
  const scoreBadgeColor = registeredSummary
    ? getScoreBadgeColor(registeredSummary.score)
    : null;

  const updateAppearanceScrollHint = useCallback(() => {
    const grid = appearanceGridRef.current;
    if (!grid) return;
    const hasMore = grid.scrollTop + grid.clientHeight < grid.scrollHeight - 2;
    setShowAppearanceScrollHint(hasMore);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(updateAppearanceScrollHint);
    return () => cancelAnimationFrame(id);
  }, [activeAvatarSection, updateAppearanceScrollHint]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!menuRef.current || !target) return;
      if (!menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isEditModalOpen) return;
    setEditBedTime(stripSeconds(activeSleepRecord?.hora_deitar ?? null));
    setEditWakeTime(stripSeconds(activeSleepRecord?.hora_acordar ?? null));
  }, [activeSleepRecord?.hora_acordar, activeSleepRecord?.hora_deitar, isEditModalOpen]);

  // Gerenciamento de Sessão
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  // Busca do Ranking (Motor Ajustado)
  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) {
      setLoadingLeaderboard(false);
      return;
    }

    setLoadingLeaderboard(true);
    // Usamos !inner para garantir que só traga quem tem perfil
    const { data, error } = await supabase
      .from("registros_sono")
      .select("*, perfis!inner(nome, email, avatar_url)")
      .order("duracao_total", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Erro no ranking:", error);
      setLeaderboard([]);
    } else {
      // Filtra duplicatas de usuário (mostra apenas o melhor sono de cada um)
      // Opcional: Se quiser mostrar todas as noites, remova este bloco filter.
      // Aqui estamos deixando passar tudo para o MVP.
      const records = (data ?? []) as SleepRecord[];
      const grouped = records.reduce<Record<string, LeaderboardEntry>>(
        (acc, record) => {
          const scoreResult = calculateSleepDuration(
            record.hora_deitar,
            record.hora_acordar,
          );
          const recordPoints = scoreResult?.score ?? 0;
          const existing = acc[record.user_id];
          if (existing) {
            const totalMinutes = existing.totalMinutes + record.duracao_total;
            const nights = existing.nights + 1;
            acc[record.user_id] = {
              ...existing,
              duracao_total: existing.duracao_total + record.duracao_total,
              totalMinutes,
              nights,
              avgMinutes: totalMinutes / nights,
              totalPoints: existing.totalPoints + recordPoints,
              perfis: record.perfis ?? existing.perfis,
            };
            return acc;
          }

          acc[record.user_id] = {
            ...record,
            totalPoints: recordPoints,
            totalMinutes: record.duracao_total,
            nights: 1,
            avgMinutes: record.duracao_total,
          };
          return acc;
        },
        {},
      );

      const aggregate = Object.values(grouped).sort(
        (a, b) => b.totalPoints - a.totalPoints,
      );

      setLeaderboard(aggregate);
    }
    setLoadingLeaderboard(false);
  }, [supabase]);

  // Atualização de Perfil Automática
  useEffect(() => {
    if (!session || !supabase) {
      const timer = window.setTimeout(() => {
        setProfileChecked(false);
        setNeedsProfileSetup(false);
        setNickname("");
        setNicknameError(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let isMounted = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        const { error: upsertError } = await supabase
          .from("perfis")
          .upsert(
            {
              id: session.user.id,
              email: session.user.email ?? null,
            },
            { onConflict: "id" },
          );

        if (upsertError) {
          console.error("Erro perfil:", upsertError);
        }

        const { data } = await supabase
          .from("perfis")
          .select("id, nome, email, avatar_url")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        const resolvedName =
          data?.nome?.trim() ||
          session.user.email?.split("@")[0] ||
          "";

        setNickname(resolvedName);
        setNeedsProfileSetup(
          !data?.nome?.trim() || !data?.avatar_url?.trim(),
        );
        setProfileChecked(true);
      })();
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [session, supabase]);

  // Checa status de sono (State Machine)
  useEffect(() => {
    if (!session || !supabase) {
      const timer = window.setTimeout(() => {
        setSleepStatus("IDLE");
        setRegisteredSummary(null);
        setActiveSleepRecord(null);
        setSleepStartAt(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let isMounted = true;
    const checkLatest = async () => {
      const { data: openRecord, error: openError } = await supabase
        .from("registros_sono")
        .select("id, hora_deitar, hora_acordar, duracao_total, data_registro")
        .eq("user_id", session.user.id)
        .is("hora_acordar", null)
        .order("data_registro", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (openError) {
        console.error("Erro ao verificar registro:", openError);
        setSleepStatus("IDLE");
        setRegisteredSummary(null);
        setActiveSleepRecord(null);
        setSleepStartAt(null);
        return;
      }

      if (openRecord) {
        setActiveSleepRecord(openRecord);
        setSleepStatus("SLEEPING");
        setRegisteredSummary(null);
        return;
      }

      const { data, error } = await supabase
        .from("registros_sono")
        .select("id, hora_deitar, hora_acordar, duracao_total, data_registro")
        .eq("user_id", session.user.id)
        .eq("data_registro", referenceDate.iso)
        .order("data_registro", { ascending: false })
        .order("hora_deitar", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Erro ao verificar registro:", error);
        setSleepStatus("IDLE");
        setRegisteredSummary(null);
        setActiveSleepRecord(null);
        return;
      }

      if (data?.hora_acordar) {
        setActiveSleepRecord(data);
        setSleepStatus("COMPLETED");
        const summary = calculateSleepDuration(
          data.hora_deitar,
          data.hora_acordar,
        );
        setRegisteredSummary(summary);
        setSleepStartAt(null);
        return;
      }

      setSleepStatus("IDLE");
      setRegisteredSummary(null);
      setActiveSleepRecord(data ?? null);
      setSleepStartAt(null);
    };

    void checkLatest();
    return () => {
      isMounted = false;
    };
  }, [referenceDate.iso, savedTick, session, supabase]);

  // Recarrega ranking quando salva ou loga
  useEffect(() => {
    if (!session) {
      return;
    }

    const reload = () => {
      void fetchLeaderboard();
    };

    const timer = window.setTimeout(reload, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchLeaderboard, session, savedTick]);

  const maskSecret = (value?: string) =>
    value ? `${value.slice(0, 4)}...${value.slice(-4)}` : "n/a";

  useEffect(() => {
    console.log("🕵️ DEBUG DE CHAVES:");
    console.log("- URL existe?", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("- Key existe?", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log(
      "- Início da URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10),
    );
  }, []);

  // Login / Cadastro
  const handleAuthSubmit = async (event: FormEvent) => {
    console.log("🚀 Botão clicado! Modo:", authState.mode);
    event.preventDefault();
    if (!supabase) {
      console.error(
        "❌ Erro: O cliente Supabase não foi iniciado. Verifique as chaves NEXT_PUBLIC."
      );
      console.log("🔒 Valores tentados:", {
        url: maskSecret(process.env.NEXT_PUBLIC_SUPABASE_URL),
        key: maskSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      });
      setAuthState((prev) => ({
        ...prev,
        error: "Erro de conexão com o banco.",
        isSubmitting: false,
      }));
      return;
    }
    console.log("🔌 Supabase carregado com sucesso!");

    try {
      if (!isValidEmail(authState.email)) {
        setAuthState((prev) => ({ ...prev, error: "E-mail inválido." }));
        return;
      }
      if (!isValidPassword(authState.password)) {
        setAuthState((prev) => ({ ...prev, error: "Senha curta (min 6)." }));
        return;
      }

      setAuthState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      console.log("📡 Enviando dados para o Supabase...");

      if (authState.mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authState.email,
          password: authState.password,
        });
        if (error) {
          setAuthState((prev) => ({
            ...prev,
            error: "Erro no login. Verifique os dados.",
            isSubmitting: false,
          }));
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: authState.email,
          password: authState.password,
        });
        if (error) {
          setAuthState((prev) => ({
            ...prev,
            error: "Erro no cadastro.",
            isSubmitting: false,
          }));
          return;
        }
        setAuthState((prev) => ({
          ...prev,
          mode: "login",
          error: "Conta criada! Faça login.",
          isSubmitting: false,
        }));
      }

      // O useEffect de session vai lidar com o redirecionamento visual
      if (!authState.error) {
        setAuthState((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch (e) {
      console.error("🔥 Erro fatal:", e);
      setAuthState((prev) => ({
        ...prev,
        error: "Erro inesperado. Tente novamente.",
        isSubmitting: false,
      }));
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setRegisteredSummary(null);
    setSleepStatus("IDLE");
    setActiveSleepRecord(null);
    setSleepStartAt(null);
  };

  const handleSleepStart = async () => {
    if (!session || !supabase) return;
    setIsSaving(true);
    setStatusMessage(null);
    const nowTime = formatTime(new Date());
    const normalizedNow = normalizeTime(nowTime);
    const { data, error } = await supabase
      .from("registros_sono")
      .insert({
        user_id: session.user.id,
        hora_deitar: normalizedNow,
        duracao_total: 0,
        data_registro: referenceDate.iso,
      } as any)
      .select("id, hora_deitar, hora_acordar, data_registro")
      .maybeSingle();

    if (error) {
      console.error(error);
      setStatusMessage("Erro ao iniciar o sono.");
      setIsSaving(false);
      return;
    }

    if (data) {
      setActiveSleepRecord(data);
      setSleepStatus("SLEEPING");
      setSleepStartAt(new Date());
      setSavedTick((t) => t + 1);
    }
    setIsSaving(false);
  };

  const handleWakeUp = async () => {
    if (!session || !supabase) return;

    let recordId = activeSleepRecord?.id ?? null;
    let bedTime = activeSleepRecord?.hora_deitar ?? null;

    if (!recordId || !bedTime) {
      const { data, error } = await supabase
        .from("registros_sono")
        .select("id, hora_deitar, hora_acordar, data_registro")
        .eq("user_id", session.user.id)
        .is("hora_acordar", null)
        .order("data_registro", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setStatusMessage("Não foi possível localizar o registro em aberto.");
        return;
      }

      recordId = data.id;
      bedTime = data.hora_deitar;
      setActiveSleepRecord(data);
    }

    if (!bedTime) {
      setStatusMessage("Não foi possível identificar a hora de dormir.");
      return;
    }

    const nowTime = formatTime(new Date());
    const normalizedNow = normalizeTime(nowTime);
    const calc = calculateSleepDuration(stripSeconds(bedTime), nowTime);
    if (!calc) {
      setStatusMessage("Horários inválidos.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("registros_sono")
      .update({
        hora_acordar: normalizedNow,
        duracao_total: calc.totalMinutes,
      })
      .eq("id", recordId)
      .eq("user_id", session.user.id)
      .is("hora_acordar", null);

    if (error) {
      console.error(error);
      setStatusMessage("Erro ao salvar o despertar.");
      setIsSaving(false);
      return;
    }

    const { data } = await supabase
      .from("registros_sono")
      .select("id, hora_deitar, hora_acordar, duracao_total, data_registro")
      .eq("id", recordId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!data || !data.hora_acordar) {
      setStatusMessage("Não foi possível concluir o sono. Tente novamente.");
      setIsSaving(false);
      return;
    }

    setRegisteredSummary(calc);
    setActiveSleepRecord(data);
    setSleepStatus("COMPLETED");
    setSleepStartAt(null);
    setSavedTick((t) => t + 1);
    setIsSaving(false);
  };

  const handleEditTimesSave = async () => {
    if (!session || !supabase || !activeSleepRecord?.id) return;
    const normalizedBedTime = normalizeTime(editBedTime);
    const normalizedWakeTime = normalizeTime(editWakeTime);
    const calc = calculateSleepDuration(normalizedBedTime, normalizedWakeTime);
    if (!calc) {
      setStatusMessage("Horários inválidos.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("registros_sono")
      .update({
        hora_deitar: normalizedBedTime,
        hora_acordar: normalizedWakeTime,
        duracao_total: calc.totalMinutes,
      })
      .eq("id", activeSleepRecord.id);

    if (error) {
      console.error(error);
      setStatusMessage("Erro ao atualizar horário.");
      setIsSaving(false);
      return;
    }

    setRegisteredSummary(calc);
    setActiveSleepRecord((prev) =>
      prev
        ? {
            ...prev,
            hora_deitar: normalizedBedTime,
            hora_acordar: normalizedWakeTime,
          }
        : prev,
    );
    setSleepStatus("COMPLETED");
    setSavedTick((t) => t + 1);
    setIsEditModalOpen(false);
    setIsSaving(false);
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div
      className={`min-h-screen text-slate-900 font-sans pb-10 transition-colors duration-700 ${
        sleepStatus === "SLEEPING" ? "bg-[#171717]" : "bg-[#fafafa]"
      }`}
    >
      <main className="mx-auto max-w-md px-4 pt-6">

        {/* CABEÇALHO */}
        <header className="flex items-center justify-between mb-8 gap-6">
          <div className="relative">
            {sleepStatus !== "SLEEPING" ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
                >
                  <Image src="/Logo.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
                </button>
                <AnimatePresence>
                  {isMenuOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute top-full left-0 mt-2 w-44 rounded-xl border border-slate-100 bg-white shadow-lg z-50"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("home");
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-black hover:bg-slate-50 transition"
                      >
                        <HomeIcon size={16} />
                        Início
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("setup");
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-black hover:bg-slate-50 transition"
                      >
                        <Edit3 size={16} />
                        Editar Avatar
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-10 w-10" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 flex justify-center">
            <span className={sleepStatus === "SLEEPING" ? "h1 !text-white" : "h1"}>
              {currentTime.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
          {sleepStatus !== "SLEEPING" && session ? (
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <div className="h-6 w-6" aria-hidden="true" />
          )}
        </header>

        {!session ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 px-2"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {authState.mode === "login" ? "Login" : "Nova Conta"}
              </h2>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
                <input
                  type="email"
                  value={authState.email}
                  onChange={(e) => setAuthState(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition"
                  placeholder="piloto@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
                <input
                  type="password"
                  value={authState.password}
                  onChange={(e) => setAuthState(prev => ({...prev, password: e.target.value}))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition"
                  placeholder="******"
                />
              </div>

              {authState.error && (
                <p className="text-sm font-medium text-slate-600 bg-slate-100 p-3 rounded-lg">
                  {authState.error}
                </p>
              )}

              <Button
                type="submit"
                disabled={authState.isSubmitting}
                className="text-base"
              >
                {authState.isSubmitting ? "Carregando..." : authState.mode === "login" ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthState(prev => ({ ...prev, mode: prev.mode === "login" ? "signup" : "login", error: null }))}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                {authState.mode === "login" ? "Não tem conta? Crie agora" : "Já tem conta? Fazer login"}
              </button>
            </div>
          </motion.div>
        ) : (
          // ÁREA LOGADA
          <>
            {profileChecked && (needsProfileSetup || viewMode === "setup") ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Seu Avatar
                  </h2>
                  <p className="text-sm text-slate-500">
                    Escolha um apelido e personalize seu avatar.
                  </p>
                  <motion.div
                    key={avatarUrl}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="flex h-32 w-32 items-center justify-center rounded-full"
                  >
                    <Image
                      src={avatarUrl}
                      alt="Prévia do avatar"
                      width={112}
                      height={112}
                      unoptimized
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  </motion.div>
                </div>

                <div className="my-8 h-px w-full bg-slate-200" />

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                      Apelido
                    </label>
                    <input
                      value={nickname}
                      onChange={(event) => {
                        setNickname(event.target.value);
                        setNicknameError(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition"
                      placeholder="Seu nome de piloto"
                    />
                    {nicknameError ? (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {nicknameError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="my-8 h-px w-full bg-slate-200" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      APARÊNCIA
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 pr-1">
                      {avatarSectionTabs.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveAvatarSection(item.id)}
                            className={`flex flex-col items-center gap-1 flex-none px-4 pt-2 pb-1 text-sm font-semibold uppercase transition ${
                              activeAvatarSection === item.id
                                ? "text-slate-900 opacity-100"
                                : "text-slate-500 opacity-60"
                            }`}
                          >
                            <span>{item.label}</span>
                            <span
                              className={`h-[2px] w-full rounded-full transition ${
                                activeAvatarSection === item.id
                                  ? "bg-slate-900 opacity-100"
                                  : "bg-transparent opacity-0"
                              }`}
                            />
                          </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <div className="relative bg-[#fafafa]">
                      <motion.div
                        key={activeAvatarSection}
                        ref={appearanceGridRef}
                        onScroll={updateAppearanceScrollHint}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-6 grid w-full grid-cols-3 gap-2 max-h-40 overflow-y-auto overflow-x-hidden pr-1"
                      >
                      {activeAvatarSection === "hair" &&
                        [
                          "shortFlat",
                          "shortRound",
                          "shortCurly",
                          "shortWaved",
                          "theCaesar",
                          "theCaesarAndSidePart",
                          "sides",
                          "bob",
                          "bun",
                          "longButNotTooLong",
                          "shaggy",
                          "shaggyMullet",
                          "frizzle",
                          "bigHair",
                          "curly",
                          "curvy",
                          "dreads",
                          "dreads01",
                          "dreads02",
                        ].map((option) => {
                          const previewUrl = buildAvatarUrl(nickname, {
                            ...avatarOptions,
                            top: option,
                          });
                          const label = hairOptionLabels[option] ?? option;
                          const isActiveOption = avatarOptions.top === option;
                          return (
                            <motion.button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAvatarOptions((prev) => ({ ...prev, top: option }))
                              }
                              className={`${appearanceOptionButtonBase} ${
                                isActiveOption
                                  ? "text-slate-900 opacity-100"
                                  : "text-slate-500 opacity-60"
                              }`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={appearanceAnimateProps(isActiveOption)}
                              transition={{ duration: 0.2 }}
                            >
                              <Image
                                src={previewUrl}
                                alt={`Prévia ${label}`}
                                width={appearancePreviewSize}
                                height={appearancePreviewSize}
                                unoptimized
                                className="h-12 w-12 rounded-full bg-white"
                              />
                              <span>{label}</span>
                            </motion.button>
                          );
                        })}

                      {activeAvatarSection === "hairColor" &&
                        Object.entries(hairColorPalette).map(([id, color]) => (
                          <motion.button
                            key={id}
                            type="button"
                            onClick={() =>
                              setAvatarOptions((prev) => ({ ...prev, hairColor: id }))
                            }
                            className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${
                              avatarOptions.hairColor === id
                                ? "border-slate-900 shadow-lg"
                                : "border-slate-200"
                            }`}
                            style={{ backgroundColor: `#${color}` }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {avatarOptions.hairColor === id && (
                              <span className="h-3 w-3 rounded-full bg-white" />
                            )}
                          </motion.button>
                        ))}

                      {activeAvatarSection === "eyes" &&
                        [
                          "default",
                          "happy",
                          "surprised",
                          "closed",
                          "squint",
                          "wink",
                          "winkWacky",
                          "cry",
                          "hearts",
                          "side",
                          "eyeRoll",
                        ].map((option) => {
                          const previewUrl = buildAvatarUrl(nickname, {
                            ...avatarOptions,
                            eyes: option,
                          });
                          const label = eyesOptionLabels[option] ?? option;
                          const isActiveOption = avatarOptions.eyes === option;
                          return (
                            <motion.button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAvatarOptions((prev) => ({
                                  ...prev,
                                  eyes: option,
                                }))
                              }
                              className={`${appearanceOptionButtonBase} ${
                                isActiveOption
                                  ? "text-slate-900 opacity-100"
                                  : "text-slate-500 opacity-60"
                              }`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={appearanceAnimateProps(isActiveOption)}
                              transition={{ duration: 0.2 }}
                            >
                              <Image
                                src={previewUrl}
                                alt={`Prévia ${label}`}
                                width={appearancePreviewSize}
                                height={appearancePreviewSize}
                                unoptimized
                                className="h-12 w-12 rounded-full bg-white"
                              />
                              <span>{label}</span>
                            </motion.button>
                          );
                        })}

                      {activeAvatarSection === "mouth" &&
                        [
                          "default",
                          "smile",
                          "serious",
                          "grimace",
                          "tongue",
                          "disbelief",
                          "vomit",
                          "concerned",
                          "eating",
                          "sad",
                          "screamOpen",
                        ].map((option) => {
                          const previewUrl = buildAvatarUrl(nickname, {
                            ...avatarOptions,
                            mouth: option,
                          });
                          const label = mouthOptionLabels[option] ?? option;
                          const isActiveOption = avatarOptions.mouth === option;
                          return (
                            <motion.button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAvatarOptions((prev) => ({
                                  ...prev,
                                  mouth: option,
                                }))
                              }
                              className={`${appearanceOptionButtonBase} ${
                                isActiveOption
                                  ? "text-slate-900 opacity-100"
                                  : "text-slate-500 opacity-60"
                              }`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={appearanceAnimateProps(isActiveOption)}
                              transition={{ duration: 0.2 }}
                            >
                              <Image
                                src={previewUrl}
                                alt={`Prévia ${label}`}
                                width={appearancePreviewSize}
                                height={appearancePreviewSize}
                                unoptimized
                                className="h-12 w-12 rounded-full bg-white"
                              />
                              <span>{label}</span>
                            </motion.button>
                          );
                        })}

                      {activeAvatarSection === "beard" &&
                        facialHairOptions.map((option) => {
                          const previewUrl = buildAvatarUrl(nickname, {
                            ...avatarOptions,
                            facialHair: option,
                          });
                          const label = facialHairOptionLabels[option] ?? option;
                          const isActiveOption = avatarOptions.facialHair === option;
                          return (
                            <motion.button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAvatarOptions((prev) => ({
                                  ...prev,
                                  facialHair: option,
                                }))
                              }
                              className={`${appearanceOptionButtonBase} ${
                                isActiveOption
                                  ? "text-slate-900 opacity-100"
                                  : "text-slate-500 opacity-60"
                              }`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={appearanceAnimateProps(isActiveOption)}
                              transition={{ duration: 0.2 }}
                            >
                              <Image
                                src={previewUrl}
                                alt={`Prévia ${label}`}
                                width={appearancePreviewSize}
                                height={appearancePreviewSize}
                                unoptimized
                                className="h-12 w-12 rounded-full bg-white"
                              />
                              <span>{label}</span>
                            </motion.button>
                          );
                        })}

                      {activeAvatarSection === "beardColor" &&
                        Object.entries(hairColorPalette).map(([id, color]) => (
                          <motion.button
                            key={id}
                            type="button"
                            onClick={() =>
                              setAvatarOptions((prev) => ({
                                ...prev,
                                facialHairColor: id,
                              }))
                            }
                            className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${
                              avatarOptions.facialHairColor === id
                                ? "border-slate-900 shadow-lg"
                                : "border-slate-200"
                            }`}
                            style={{ backgroundColor: `#${color}` }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {avatarOptions.facialHairColor === id && (
                              <span className="h-3 w-3 rounded-full bg-white" />
                            )}
                          </motion.button>
                        ))}

                      {activeAvatarSection === "clothing" &&
                        [
                          "blazerAndShirt",
                          "blazerAndSweater",
                          "collarAndSweater",
                          "graphicShirt",
                          "hoodie",
                          "overall",
                          "shirtCrewNeck",
                          "shirtScoopNeck",
                          "shirtVNeck",
                        ].map((option) => {
                          const previewUrl = buildAvatarUrl(nickname, {
                            ...avatarOptions,
                            clothing: option,
                          });
                          const label = clothingOptionLabels[option] ?? option;
                          const isActiveOption = avatarOptions.clothing === option;
                          return (
                            <motion.button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAvatarOptions((prev) => ({
                                  ...prev,
                                  clothing: option,
                                }))
                              }
                              className={`${appearanceOptionButtonBase} ${
                                isActiveOption
                                  ? "text-slate-900 opacity-100"
                                  : "text-slate-500 opacity-60"
                              }`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={appearanceAnimateProps(isActiveOption)}
                              transition={{ duration: 0.2 }}
                            >
                              <Image
                                src={previewUrl}
                                alt={`Prévia ${label}`}
                                width={appearancePreviewSize}
                                height={appearancePreviewSize}
                                unoptimized
                                className="h-12 w-12 rounded-full bg-white"
                              />
                              <span>{label}</span>
                            </motion.button>
                          );
                        })}

                      {activeAvatarSection === "clotheColor" &&
                        Object.entries(clotheColorPalette).map(([id, color]) => (
                          <motion.button
                            key={id}
                            type="button"
                            onClick={() =>
                              setAvatarOptions((prev) => ({ ...prev, clotheColor: id }))
                            }
                            className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${
                              avatarOptions.clotheColor === id
                                ? "border-slate-900 shadow-lg"
                                : "border-slate-200"
                            }`}
                            style={{ backgroundColor: `#${color}` }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {avatarOptions.clotheColor === id && (
                              <span className="h-3 w-3 rounded-full bg-white" />
                            )}
                          </motion.button>
                        ))}

                      {activeAvatarSection === "skin" &&
                        ["614335", "ae5d29", "d08b5b", "edb98a", "ffdbb4", "f8d25c"].map(
                          (option) => {
                            const isActiveOption = avatarOptions.skinColor === option;
                            return (
                              <motion.button
                                key={option}
                                type="button"
                                onClick={() =>
                                  setAvatarOptions((prev) => ({
                                    ...prev,
                                    skinColor: option,
                                  }))
                                }
                                className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${
                                  isActiveOption
                                    ? "border-slate-900 shadow-lg"
                                    : "border-slate-200"
                                }`}
                                style={{ backgroundColor: `#${option}` }}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {isActiveOption && (
                                  <span className="h-3 w-3 rounded-full bg-white" />
                                )}
                              </motion.button>
                            );
                          }
                        )}
                      {activeAvatarSection === "eyebrows" &&
                        eyebrowOptions.map((option) => {
                          const previewUrl = buildAvatarUrl(nickname, {
                            ...avatarOptions,
                            eyebrows: option,
                          });
                          const label = eyebrowOptionLabels[option] ?? option;
                          const isActiveOption = avatarOptions.eyebrows === option;
                          return (
                            <motion.button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAvatarOptions((prev) => ({
                                  ...prev,
                                  eyebrows: option,
                                }))
                              }
                              className={`${appearanceOptionButtonBase} ${
                                isActiveOption
                                  ? "text-slate-900 opacity-100"
                                  : "text-slate-500 opacity-60"
                              }`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={appearanceAnimateProps(isActiveOption)}
                              transition={{ duration: 0.2 }}
                            >
                              <Image
                                src={previewUrl}
                                alt={`Prévia ${label}`}
                                width={appearancePreviewSize}
                                height={appearancePreviewSize}
                                unoptimized
                                className="h-12 w-12 rounded-full bg-white"
                              />
                              <span>{label}</span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                      <div
                        className={`pointer-events-none absolute inset-x-0 -bottom-px h-8 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/90 to-transparent transition-opacity ${
                          showAppearanceScrollHint ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                  </AnimatePresence>
                </div>

                  <Button
                    type="button"
                    disabled={isSavingProfile}
                    variant="primary"
                    onClick={async () => {
                      const error = validateNickname(nickname);
                      if (error) {
                        setNicknameError(error);
                        return;
                      }

                      if (!session || !supabase) return;

                      setIsSavingProfile(true);
                      const payload = {
                        id: session.user.id,
                        nome: nickname.trim(),
                        email: session.user.email ?? null,
                        avatar_url: avatarUrl,
                      };

                      const { error: saveError } = await supabase
                        .from("perfis")
                        .upsert(payload, { onConflict: "id" });

                      if (saveError) {
                        setNicknameError("Não foi possível salvar o avatar.");
                      } else {
                        setNeedsProfileSetup(false);
                        setNicknameError(null);
                        if (!needsProfileSetup && viewMode === "setup") {
                          setViewMode("home");
                        }
                      }

                      setIsSavingProfile(false);
                    }}
                    className="mt-6 text-base"
                  >
                    {isSavingProfile
                      ? "Salvando..."
                      : !needsProfileSetup && viewMode === "setup"
                      ? "Salvar Alterações"
                      : "Salvar"}
                  </Button>
              </motion.div>
            ) : profileChecked ? (
              <>
                {/* CARTÃO DE REGISTRO */}
                <div className="mb-8">
                  {sleepStatus === "IDLE" || sleepStatus === "SLEEPING" ? (
                    <div className="p-8 mb-8 relative overflow-hidden">
                      <div className={`flex justify-end ${sleepStatus === "SLEEPING" ? "opacity-0 pointer-events-none" : ""}`}>
                        <div className="flex flex-col items-end">
                          <span className="hS font-light tracking-tighter leading-none">
                            {displayDay}
                          </span>
                          <span className="text-lg font-medium tracking-widest text-slate-400 uppercase">
                            {displayMonth}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {sleepStatus === "SLEEPING" ? (
                          <p className="text-sm text-slate-300 mb-3">
                            Já acordou? Clique aqui e calcule suas horas de sono.
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          disabled={isSaving || isSleepLocked}
                          variant="primary"
                          onClick={sleepStatus === "SLEEPING" ? handleWakeUp : handleSleepStart}
                          className={`text-2xl font-bold tracking-wide ${
                            sleepStatus === "SLEEPING"
                              ? "!bg-[#fafafa] !text-black hover:!bg-[#f0f0f0] mt-0"
                              : "mt-12"
                          }`}
                        >
                          {sleepStatus === "SLEEPING"
                            ? isSleepLocked
                              ? "Durma bem!"
                              : "Acordar"
                            : "IR DORMIR"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {sleepStatus === "COMPLETED" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 flex flex-col items-end"
                    >
                      <div className="text-right space-y-1">
                      <h2 className="h1">Sono registrado</h2>
                        <p className="text-sm text-slate-500">
                          O próximo turno começa às 17h.
                        </p>
                    </div>

                      {registeredSummary ? (
                        <div className="flex items-center justify-between w-full mt-6">
                          <div
                            className="rounded-2xl px-4 py-3 text-lg font-bold text-white shadow-md min-w-[90px] text-center"
                            style={{
                              backgroundColor: scoreBadgeColor ?? "#94a3b8",
                            }}
                          >
                            {registeredSummary.score} pts
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-500">
                              Total dormido
                            </p>
                            <p className="text-4xl font-bold text-slate-800">
                              {registeredSummary.hours}h {registeredSummary.minutes}m
                            </p>
                            {sleepTimeRange ? (
                              <p className="text-xs font-semibold text-slate-500">
                                {sleepTimeRange}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  ) : null}

                  {statusMessage ? (
                    <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      {statusMessage}
                    </p>
                  ) : null}

                  {sleepStatus !== "SLEEPING" ? (
                    <div className="my-8 h-px w-full bg-slate-200" />
                  ) : null}
                </div>

                {/* RANKING DA LIGA */}
                {sleepStatus !== "SLEEPING" ? (
                  <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="text-slate-700" size={20} />
                        <h3 className="font-bold text-slate-800">Ranking Geral</h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {loadingLeaderboard ? (
                        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
                          Atualizando a pista...
                        </div>
                      ) : leaderboard.length === 0 ? (
                        <div className="px-0 py-6 text-center text-slate-500">
                          Nenhum piloto na pista ainda.
                        </div>
                      ) : (
                        leaderboard.map((record, index) => {
                          // --- AJUSTE TÉCNICO CRÍTICO DO COBRA ---
                          // Verifica se 'perfis' é array ou objeto para evitar erro
                          const perfilData = Array.isArray(record.perfis) 
                            ? record.perfis[0] 
                            : record.perfis;
                          
                          const name = perfilData?.nome || perfilData?.email?.split('@')[0] || "Piloto Anônimo";
                          const avatar = perfilData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.user_id}`;

                          return (
                            <motion.div
                              key={record.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between px-0 py-3 border-b border-slate-200 last:border-b-0"
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-600">
                                  #{index + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <Image
                                    src={avatar}
                                    alt={name}
                                    width={40}
                                    height={40}
                                    unoptimized
                                    className="h-10 w-10 rounded-full bg-slate-100 object-cover"
                                  />
                                  <p className="font-bold text-slate-800 text-sm">{name}</p>
                                </div>
                              </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">
                              {Math.round(record.totalPoints)} pts
                            </span>
                            <p className="text-xs text-slate-400">
                              Total dormido · {formatDuration(record.totalMinutes)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
                  </div>
                ) : null}

                <AnimatePresence>
                  {isEditModalOpen ? (
                    <motion.div
                      className="fixed inset-0 z-50 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsEditModalOpen(false)}
                        aria-label="Fechar edição de horário"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                      >
                        <h3 className="text-lg font-semibold text-slate-900">
                          Editar horário
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Ajuste os horários manualmente.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400">
                              Deitar
                            </label>
                            <input
                              type="time"
                              value={editBedTime}
                              onChange={(e) => setEditBedTime(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400">
                              Acordar
                            </label>
                            <input
                              type="time"
                              value={editWakeTime}
                              onChange={(e) => setEditWakeTime(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 transition"
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex items-center justify-end gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsEditModalOpen(false)}
                            className="!w-auto !px-4 !py-2 text-sm"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={handleEditTimesSave}
                            disabled={isSaving}
                            className="!w-auto !px-4 !py-2 text-sm"
                          >
                            Salvar
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </>
            ) : (
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 mb-8">
                <div className="text-sm text-slate-500">Carregando perfil...</div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
