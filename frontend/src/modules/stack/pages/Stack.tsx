import React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function Stack() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b-2 border-stone-900 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-px w-8 bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
                  Stack
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 leading-[0.9]">
                UI
                <br />
                <span className="text-amber-500">Components.</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-none bg-amber-500 text-white hover:bg-amber-600">
              Primary
            </Button>
            <Button variant="outline" className="rounded-none">
              Outline
            </Button>
            <Button size="sm" className="rounded-none bg-stone-900 text-white">
              Small
            </Button>
            <Button
              size="lg"
              className="rounded-none bg-amber-500 text-white hover:bg-amber-600"
            >
              Large
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Inputs</h2>
          <div className="max-w-sm space-y-3">
            <Input placeholder="Default input" className="rounded-none" />
            <Input
              placeholder="With border-stone-300"
              className="rounded-none border-stone-300"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Card</h2>
          <Card className="rounded-none p-6">
            <h3 className="font-bold text-stone-900">Card Title</h3>
            <p className="mt-2 text-sm text-stone-500">
              Card content goes here.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}
