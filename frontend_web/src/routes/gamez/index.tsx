import { Resource, component$, useResource$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { serverFetcher } from "~/util/serverFetcher";
import { useAuthSession } from "../plugin@auth";
import { getGithubUserIdFromUserImage } from "~/util/getGithubUserIdFromUserImage";
import type { Session } from "@auth/core/types";
import DayLink from "~/components/game/dayLink/dayLink";

const gameNumber = 1;

export const onRequest: RequestHandler = (event) => {
  const session: Session | null = event.sharedMap.get("session");
  if (!session || new Date(session.expires) < new Date()) {
    throw event.redirect(302, `/login`);
  }
};

export default component$(() => {
  const session = useAuthSession();
  const userId = getGithubUserIdFromUserImage(session.value!.user!.image!);

  const gameDataResource = useResource$<any>(async ({ cleanup }) => {
    const abortController = new AbortController();
    cleanup(() => abortController.abort("cleanup"));
    const gameData = await serverFetcher(
      `gamedata/${gameNumber}`,
      "GET",
      userId
    );
    return {
      game: gameData,
    };
  });

  return (
    <div>
      <div>
        <h1 class="title">Xtreme Xmas Day Viewer</h1>
        <h2>Enter Game and Day IDs:</h2>

        <Resource
          value={gameDataResource}
          onPending={() => {
            return (
              <>
                {() => {
                  for (let i = 1; i <= 25; i++) {
                    <div>Day {i}</div>;
                  }
                }}
              </>
            );
          }}
          onResolved={(gameData) => {
            const lockedDays = [];
            for (let i = gameData.game.currentDay + 1; i <= 25; i++) {
              lockedDays.push({ number: i });
            }
            const sortedDays = gameData.game.Day.sort((a: any, b: any) => {
              return a.number - b.number;
            });
            return (
              <>
                {sortedDays.map(
                  (day: {
                    number: number;
                    challengeModifierId: string;
                    modifierOptionId: string;
                  }) => (
                    <DayLink
                      key={`unlockedDay-${day.number}`}
                      dayNumber={day.number}
                      dayLinkData={{
                        challengeModifier: day.challengeModifierId,
                        modifierOption: day.modifierOptionId,
                        score: 100,
                        isCompleted: true,
                        tokensGained: 2,
                        tokensSpent: 2,
                      }}
                    />
                  )
                )}
                {lockedDays.map((day: { number: number }) => (
                  <DayLink
                    key={`lockedDay-${day.number}`}
                    dayNumber={day.number}
                  />
                ))}
              </>
            );
          }}
        />
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Xtreme Xmas - Day Viewer",
  meta: [
    {
      name: "description",
      content:
        "Xtreme Xmas - an invigorating twist on your favorite advent calendar",
    },
  ],
};