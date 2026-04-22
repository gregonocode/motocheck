"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Share2, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const IOS_TUTORIAL_URL = "https://www.youtube.com/shorts/E4N-ql_FVT4";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function getPlatform() {
  if (typeof window === "undefined") {
    return {
      isAndroid: false,
      isIos: false,
      isSafari: false,
    };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isIos =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isSafari =
    /safari/.test(ua) && !/chrome|crios|fxios|edgios|opr\//.test(ua);

  return { isAndroid, isIos, isSafari };
}

export default function PwaInstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState(() => getPlatform());

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const frame = window.requestAnimationFrame(() => {
      setPlatform(getPlatform());
      setIsStandalone(isStandaloneMode());
    });

    const handleDisplayModeChange = () => {
      setIsStandalone(isStandaloneMode());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    media.addEventListener?.("change", handleDisplayModeChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener?.("change", handleDisplayModeChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  }

  if (isStandalone || isDismissed) {
    return null;
  }

  const showAndroidInstall = platform.isAndroid && !!deferredPrompt;
  const showIosGuide = platform.isIos;

  if (!showAndroidInstall && !showIosGuide) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="bg-yellow-300/70 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181818] text-yellow-300 shadow-sm">
                <Smartphone className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#181818]/70">
                  Acesso Rápido
                </p>
                <h2 className="text-lg font-black text-[#181818]">
                  Instalar MotoCheck
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#181818]/70 transition hover:bg-white/60 hover:text-[#181818]"
              aria-label="Fechar aviso de instalação"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {showAndroidInstall ? (
            <>
              <p className="text-sm font-medium leading-6 text-zinc-600">
                Instale o MotoCheck no celular para abrir mais rápido, usar em
                tela cheia e deixar o atendimento ainda mais prático no balcão.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download className="h-4 w-4" />
                  {isInstalling ? "Abrindo instalação..." : "Instalar aplicativo"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-[#181818] transition hover:bg-zinc-50"
                >
                  Agora não
                </button>
              </div>
            </>
          ) : null}

          {showIosGuide ? (
            <>
              <p className="text-sm font-medium leading-6 text-zinc-600">
                No iPhone, abra o MotoCheck pelo Safari e adicione o app à tela
                inicial para usar em tela cheia.
              </p>

              <div className="mt-5 rounded-[28px] bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-200 text-[#181818]">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#181818]">
                      1. Toque em Compartilhar
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                      Use o botão de compartilhamento do Safari.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-200 text-[#181818]">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#181818]">
                      2. Toque em Adicionar à Tela de Início
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                      Depois confirme para instalar o MotoCheck.
                    </p>
                  </div>
                </div>
              </div>

              {!platform.isSafari ? (
                <p className="mt-4 text-xs font-bold leading-5 text-amber-600">
                  Para instalar no iPhone, abra esta página no Safari.
                </p>
              ) : null}

              <div className="mt-5 grid gap-3">
                <a
                  href={IOS_TUTORIAL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#181818] px-5 text-sm font-extrabold text-white transition hover:opacity-95"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver tutorial
                </a>

                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-[#181818] transition hover:bg-zinc-50"
                >
                  Entendi
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
