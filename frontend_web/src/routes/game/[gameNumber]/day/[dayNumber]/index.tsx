import {
  Resource,
  component$,
  useResource$,
  useStore,
  useStylesScoped$,
} from "@builder.io/qwik";
import {
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { serverFetcher } from "~/util/serverFetcher";
import { getGithubUserIdFromUserImage } from "~/util/getGithubUserIdFromUserImage";
import type { Session } from "@auth/core/types";
import { useAuthSession } from "~/routes/plugin@auth";
import styles from "./day.css?inline";

let gameInfo: {
  numberOfGames: string;
  challengeModifier: string;
  modifierOption: string;
  rerollTokensSpentDuringPart1: number;
  rerollTokensSpentDuringPart2: number;
  currentRerollTokens: number;
  netScore: number;
  currentDay: number;
  currentDayCompleted: string;
  part1Completed: string;
  modifierWhenPart1Completed: string;
  optionWhenPart1Completed: string;
  part2Completed: string;
} | null;

export const onRequest: RequestHandler = (event) => {
  const session: Session | null = event.sharedMap.get("session");
  if (!session || new Date(session.expires) < new Date()) {
    throw event.redirect(302, `/login`);
  }
  event.cookie.set("gameNumber", event.params.gameNumber, {
    path: "/",
    secure: true,
  });
  const gameInfoString = event.cookie.get("gameInfo")?.value || null;
  if (gameInfoString) {
    gameInfo = JSON.parse(gameInfoString);
  }
};

export default component$(() => {
  useStylesScoped$(styles);
  const session = useAuthSession();
  const userId = getGithubUserIdFromUserImage(session.value!.user!.image!);
  const gameNumber = useLocation().params.gameNumber;
  const dayNumber = useLocation().params.dayNumber;

  const state = useStore({
    gameNumber,
    dayNumber,
    buttonPresses: 0,
    loading: false,
    gameInfo,
  });

  const xtremeXmasUserDataResource = useResource$<any>(
    async ({ track, cleanup }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const buttonPresses = track(() => state.buttonPresses);
      state.loading = true;

      const abortController = new AbortController();
      cleanup(() => abortController.abort("cleanup"));
      const userData = await serverFetcher(`userdata`, "GET", userId);
      if (userData.Game.length < 1) {
        return { numberOfGames: JSON.stringify(userData.Game.length) };
      }
      const gameData = userData.Game.find(
        (game: { number: number }) => game.number === +gameNumber
      );
      const dayData = gameData.Day.find(
        (day: { number: number }) => day.number === +dayNumber
      );
      state.loading = false;
      const returnData = {
        numberOfGames: JSON.stringify(userData.Game.length),
        challengeModifier: dayData.challengeModifierId
          ? dayData.ChallengeModifier.text
          : "None",
        modifierOption: dayData.modifierOptionId
          ? dayData.ModifierOption.text
          : "None",
        rerollTokensSpentDuringPart1:
          dayData.challengeModifierRerollsUsed * 2 +
          dayData.modifierOptionRerollsUsed -
          dayData.rerollTokensSpentDuringPart2,
        rerollTokensSpentDuringPart2: dayData.rerollTokensSpentDuringPart2,
        currentRerollTokens: gameData.currentRerollTokens,
        netScore: dayData.netScore,
        currentDay: gameData.currentDay,
        currentDayCompleted: gameData.currentDayCompleted ? "Yes" : "No",
        part1Completed: dayData.part1Completed ? "Yes" : "No",
        modifierWhenPart1Completed: dayData.modifierWhenPart1Completed || null,
        optionWhenPart1Completed: dayData.optionWhenPart1Completed || null,
        part2Completed: dayData.part2Completed ? "Yes" : "No",
      };
      state.gameInfo = returnData;
      return returnData;
    }
  );

  return (
    <article>
      <h1 class="title">---Day {dayNumber}---</h1>
      <Resource
        value={xtremeXmasUserDataResource}
        onPending={() => {
          state.loading = true;
          return (
            <ul>
              <li>
                Reroll Tokens Earned: <strong>Loading...</strong>
              </li>
              <li>
                Reroll Tokens Spent During Part 1: <strong>Loading...</strong>
              </li>
              <li>
                Reroll Tokens Spent During Part 2: <strong>Loading...</strong>
              </li>
              <li>
                Current Reroll Tokens: <strong>Loading...</strong>
              </li>
              <li>
                Estimated Net Score: <strong>Loading...</strong>
              </li>
              <li>
                Challenge Modifier: <strong>Loading...</strong>
              </li>
              <li>
                Current Day: <strong>Loading...</strong>
              </li>
              <li>
                Current Day Completed?: <strong>Loading...</strong>
              </li>
              <li>
                Selected Day Part 1 Completed?: <strong>Loading...</strong>
              </li>
              <li>
                Selected Day Part 2 Completed?: <strong>Loading...</strong>
              </li>
            </ul>
          );
        }}
        onResolved={(xtremeXmasData) => {
          state.loading = false;
          if (+xtremeXmasData.numberOfGames < 1) {
            return (
              <p>
                Day not found - please try again or{" "}
                <a href="/new">[start a new game!]</a>
              </p>
            );
          }

          return (
            <>
              <ul class="flex column">
                <li>
                  Reroll Tokens Earned:{" "}
                  <strong class="token">
                    {xtremeXmasData.part2Completed === "Yes"
                      ? "**"
                      : xtremeXmasData.part1Completed === "Yes"
                      ? "*"
                      : ""}
                  </strong>
                </li>
                <li>
                  Reroll Tokens Spent During Part 1:{" "}
                  <strong class="tokenSpent">
                    {xtremeXmasData.rerollTokensSpentDuringPart1 > 9
                      ? xtremeXmasData.rerollTokensSpentDuringPart1 + "*"
                      : "﹡".repeat(
                          xtremeXmasData.rerollTokensSpentDuringPart1
                        )}
                  </strong>
                </li>
                <li>
                  Reroll Tokens Spent During Part 2:{" "}
                  <strong class="tokenSpent">
                    {xtremeXmasData.rerollTokensSpentDuringPart2 > 9
                      ? xtremeXmasData.rerollTokensSpentDuringPart2 + "*"
                      : "﹡".repeat(
                          xtremeXmasData.rerollTokensSpentDuringPart2
                        )}
                  </strong>
                </li>
                <li>
                  Current Reroll Tokens:{" "}
                  <strong class="token">
                    {xtremeXmasData.currentRerollTokens > 9
                      ? xtremeXmasData.currentRerollTokens + "*"
                      : "*".repeat(xtremeXmasData.currentRerollTokens)}
                  </strong>
                </li>
                <li>
                  Estimated Net Score:{" "}
                  {xtremeXmasData.netScore > 0 ? (
                    <strong class="token">+{xtremeXmasData.netScore}</strong>
                  ) : (
                    <strong class="tokenSpent">
                      {xtremeXmasData.netScore}
                    </strong>
                  )}
                </li>
                <li>
                  Challenge Modifier:{" "}
                  <strong>
                    {xtremeXmasData.challengeModifier === "None"
                      ? "None"
                      : "You must complete this challenge " +
                        xtremeXmasData.challengeModifier}
                    {xtremeXmasData.modifierOption !== "None" &&
                      xtremeXmasData.modifierOption}
                  </strong>{" "}
                  {xtremeXmasData.part2Completed === "Yes" ? (
                    <></>
                  ) : xtremeXmasData.challengeModifier === "None" ? (
                    <a
                      onClick$={async () => {
                        if (state.loading) {
                          return;
                        }
                        state.loading = true;
                        await serverFetcher(
                          `game/${state.gameNumber}/day/${state.dayNumber}/roll`,
                          "PUT",
                          userId
                        );
                        state.buttonPresses++;
                      }}
                    >
                      [Roll Initial Challenge Modifier]
                    </a>
                  ) : (
                    <li>
                      <a
                        onClick$={async () => {
                          if (state.loading) {
                            return;
                          }
                          state.loading = true;
                          await serverFetcher(
                            `game/${state.gameNumber}/day/${state.dayNumber}/reroll/modifier`,
                            "PUT",
                            userId
                          );
                          state.buttonPresses++;
                        }}
                      >
                        [Reroll Challenge Modifier]
                      </a>{" "}
                      for <strong class="tokenSpent">﹡﹡</strong>
                    </li>
                  )}{" "}
                  {xtremeXmasData.modifierOption !== "None" &&
                    xtremeXmasData.part2Completed !== "Yes" && (
                      <li>
                        <a
                          onClick$={async () => {
                            if (state.loading) {
                              return;
                            }
                            state.loading = true;
                            await serverFetcher(
                              `game/${state.gameNumber}/day/${state.dayNumber}/reroll/option`,
                              "PUT",
                              userId
                            );
                            state.buttonPresses++;
                          }}
                        >
                          [Reroll Modifier Option]
                        </a>{" "}
                        ({xtremeXmasData.modifierOption}) for{" "}
                        <strong class="tokenSpent">﹡</strong>
                      </li>
                    )}
                </li>
                <li>
                  Current Day: <strong>{xtremeXmasData.currentDay}</strong>{" "}
                  {xtremeXmasData.currentDayCompleted !== "Yes" ||
                  xtremeXmasData.currentDay != +state.dayNumber ? (
                    <></>
                  ) : (
                    <a
                      onClick$={async () => {
                        if (state.loading) {
                          return;
                        }
                        state.loading = true;
                        const res = await serverFetcher(
                          `game/${state.gameNumber}/day/${
                            +state.dayNumber + 1
                          }`,
                          "PUT",
                          userId
                        );
                        state.buttonPresses++;
                        window.location.href = `/game/${
                          state.gameNumber
                        }/day/${+res.number}`;
                      }}
                    >
                      [ Start Next Day]
                    </a>
                  )}
                </li>
                <li>
                  Current Day Completed?{" "}
                  <strong>{xtremeXmasData.currentDayCompleted}</strong>{" "}
                </li>
                <li>
                  Selected Day Part 1 Completed?{" "}
                  <strong>{xtremeXmasData.part1Completed}</strong>{" "}
                  {xtremeXmasData.challengeModifier === "None" ||
                  xtremeXmasData.part1Completed === "Yes" ? (
                    <></>
                  ) : (
                    <a
                      onClick$={async () => {
                        if (state.loading) {
                          return;
                        }
                        state.loading = true;
                        await serverFetcher(
                          `game/${state.gameNumber}/day/${state.dayNumber}/complete/part1`,
                          "PUT",
                          userId
                        );
                        state.buttonPresses++;
                      }}
                    >
                      [Complete Part 1]
                    </a>
                  )}
                </li>
                {xtremeXmasData.modifierWhenPart1Completed &&
                  (xtremeXmasData.modifierWhenPart1Completed !==
                    xtremeXmasData.challengeModifier ||
                    xtremeXmasData.optionWhenPart1Completed !==
                      xtremeXmasData.modifierOption) && (
                    <li>
                      Challenge Modifier During Part 1:{" "}
                      <strong>
                        {xtremeXmasData.challengeModifier === "None"
                          ? "None"
                          : "You must complete this challenge " +
                            xtremeXmasData.challengeModifier}
                        {xtremeXmasData.modifierOption !== "None" &&
                          xtremeXmasData.modifierOption}
                      </strong>
                    </li>
                  )}
                <li>
                  Selected Day Part 2 Completed?{" "}
                  <strong>{xtremeXmasData.part2Completed}</strong>{" "}
                  {xtremeXmasData.part1Completed !== "Yes" ||
                  xtremeXmasData.part2Completed === "Yes" ? (
                    <></>
                  ) : (
                    <a
                      onClick$={async () => {
                        if (state.loading) {
                          return;
                        }
                        state.loading = true;
                        await serverFetcher(
                          `game/${state.gameNumber}/day/${state.dayNumber}/complete/part2`,
                          "PUT",
                          userId
                        );
                        state.buttonPresses++;
                      }}
                    >
                      [Complete Part 2]
                    </a>
                  )}
                </li>{" "}
              </ul>
              {+dayNumber > 1 && (
                <a href={`/game/${gameNumber}/day/${+dayNumber - 1}/`}>
                  [Previous Day]
                </a>
              )}{" "}
              {dayNumber < xtremeXmasData.currentDay && (
                <a href={`/game/${gameNumber}/day/${+dayNumber + 1}/`}>
                  [Next Day]
                </a>
              )}
            </>
          );
        }}
      />
    </article>
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
