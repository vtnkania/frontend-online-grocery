"use client";

import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: UseEmblaCarouselType[0];
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a <Carousel />");
  return context;
}

function Carousel({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel({ ...opts, axis: orientation === "horizontal" ? "x" : "y" }, plugins);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, []);

  React.useEffect(() => {
    if (!api) return;
    const timer = window.setTimeout(() => {
      onSelect(api);
      setApi?.(api);
    }, 0);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      window.clearTimeout(timer);
      api.off("select", onSelect);
    };
  }, [api, onSelect, setApi]);

  return (
    <CarouselContext.Provider value={{ carouselRef, api, opts, orientation, scrollPrev: () => api?.scrollPrev(), scrollNext: () => api?.scrollNext(), canScrollPrev, canScrollNext }}>
      <div className={cn("relative", className)} role="region" aria-roledescription="carousel" {...props}>{children}</div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel();
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)} {...props} />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();
  return <div role="group" aria-roledescription="slide" className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)} {...props} />;
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return <Button variant="secondary" size="icon" className={cn("absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 shadow", className)} disabled={!canScrollPrev} onClick={scrollPrev} {...props}><ArrowLeft className="size-4" /><span className="sr-only">Previous slide</span></Button>;
}

function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollNext, canScrollNext } = useCarousel();
  return <Button variant="secondary" size="icon" className={cn("absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 shadow", className)} disabled={!canScrollNext} onClick={scrollNext} {...props}><ArrowRight className="size-4" /><span className="sr-only">Next slide</span></Button>;
}

export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious };
