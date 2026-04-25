import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

// Placeholder deck data
const decks = [
  { id: 1, title: "Python Basics", count: 24, lastStudied: "2 days ago" },
  { id: 2, title: "Data Structures", count: 18, lastStudied: "1 week ago" },
];

export default function MyParticalHome() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-stone-900">
          Your Flashcard Decks
        </h2>
        <Button
          size="sm"
          className="rounded-none bg-indigo-600 text-white hover:bg-indigo-700"
        >
          + New Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-12 rounded-md bg-white border border-stone-100">
          <p className="text-stone-500 mb-4">
            You have no flashcard decks yet.
          </p>
          <Link to="/partical">
            <Button className="rounded-none bg-indigo-600 text-white hover:bg-indigo-700">
              Create your first deck
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="rounded-md bg-white border border-stone-100 p-4"
            >
              <h3 className="font-semibold text-stone-900">{deck.title}</h3>
              <p className="text-sm text-stone-400 mt-1">{deck.count} cards</p>
              <p className="text-xs text-stone-400 mt-1">
                Last studied: {deck.lastStudied}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
