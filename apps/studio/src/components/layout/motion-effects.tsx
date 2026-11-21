"use client";

import { useEffect } from "react";

/**
 * Cinematic arrival for every page:
 *  - big figures count up from zero when they scroll into view
 *  - charts (anything marked `data-reveal`) play their reveal when they scroll into view
 *
 * Works on the rendered DOM so it covers every workspace without touching each component. Text is
 * written to the existing text node, so React keeps owning it; if React changes the value mid-count
 * the animation stops and leaves React's value in place.
 */

const NUMBER_TOKEN = /\d[\d,]*(?:\.\d+)?/g;
const MIN_FIGURE_SIZE = 22; // px. Only headline figures count up, never table cells or labels.
const DURATION = 1500;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

interface Token {
  value: number;
  decimals: number;
  grouped: boolean;
  width: number;
  padded: boolean;
}

function parseTokens(text: string): Token[] {
  return (text.match(NUMBER_TOKEN) ?? []).map((raw) => {
    const clean = raw.replace(/,/g, "");
    const decimals = clean.includes(".") ? clean.split(".")[1]!.length : 0;
    return { value: Number(clean), decimals, grouped: raw.includes(","), width: clean.split(".")[0]!.length, padded: clean.length > 1 && clean.startsWith("0") && !clean.startsWith("0.") };
  });
}

function format(token: Token, progress: number) {
  const current = token.value * progress;
  let text = token.decimals ? current.toFixed(token.decimals) : String(Math.round(current));
  if (token.grouped) {
    const [int, dec] = text.split(".");
    text = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? `.${dec}` : "");
  }
  if (token.padded) text = text.padStart(token.width, "0");
  return text;
}

function isFigure(node: Text) {
  const text = node.nodeValue?.trim() ?? "";
  if (!text || text.length > 16 || !/\d/.test(text)) return false;
  if (/[A-Za-z]{3,}/.test(text) || /[-/:]/.test(text)) return false; // ids, dates, times, words
  const parent = node.parentElement;
  if (!parent || parent.closest("input,textarea,select,[contenteditable],.sr-only,table.sr-only")) return false;
  if (parent.childElementCount > 0) return false;
  return parseFloat(getComputedStyle(parent).fontSize) >= MIN_FIGURE_SIZE;
}

function countUp(node: Text, delay: number) {
  const finalText = node.nodeValue ?? "";
  const tokens = parseTokens(finalText);
  if (!tokens.length) return;
  const pieces = finalText.split(NUMBER_TOKEN);
  const render = (progress: number) => pieces.reduce((out, piece, i) => out + piece + (tokens[i] ? format(tokens[i]!, progress) : ""), "");
  let written = render(0);
  node.nodeValue = written;
  const start = performance.now() + delay;
  const frame = (now: number) => {
    if (node.nodeValue !== written) return; // React (or anything else) changed it: stand down
    const t = Math.max(0, (now - start) / DURATION);
    const progress = easeOutExpo(Math.min(1, t));
    written = t >= 1 ? finalText : render(progress);
    node.nodeValue = written;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function MotionEffects() {
  useEffect(() => {
    const root = document.getElementById("workspace");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const seenFigures = new WeakSet<Text>();
    const seenCharts = new WeakSet<Element>(); // per effect run, so React strict-mode re-runs observe again
    const figureObserver = new IntersectionObserver(
      (entries) => {
        let order = 0;
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((entry) => {
            figureObserver.unobserve(entry.target);
            const node = figureNodes.get(entry.target);
            if (node) countUp(node, order++ * 70);
          });
      },
      { threshold: 0.3 },
    );
    const figureNodes = new WeakMap<Element, Text>();

    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        entry.target.classList.add("is-in");
      }),
      { threshold: 0.2 },
    );

    let frameRequest = 0;
    const scan = () => {
      frameRequest = 0;
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
        if (seenCharts.has(element) || element.classList.contains("is-in")) return;
        seenCharts.add(element);
        revealObserver.observe(element);
      });
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        if (seenFigures.has(node)) continue;
        seenFigures.add(node);
        if (!isFigure(node) || !node.parentElement) continue;
        figureNodes.set(node.parentElement, node);
        figureObserver.observe(node.parentElement);
      }
    };
    const schedule = () => {
      if (!frameRequest) frameRequest = requestAnimationFrame(scan);
    };

    scan();
    const mutations = new MutationObserver(schedule);
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      figureObserver.disconnect();
      revealObserver.disconnect();
      if (frameRequest) cancelAnimationFrame(frameRequest);
    };
  }, []);

  return null;
}
