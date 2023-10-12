import { Resource, component$, useResource$, useStore } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { serverFetcher } from "~/util/serverFetcher";
import { useAuthSession } from "../plugin@auth";
import { getGithubUserIdFromUserImage } from "~/util/getGithubUserIdFromUserImage";
import type { Session } from "@auth/core/types";

const gameID = 1;
const dayID = 1;

export const onRequest: RequestHandler = (event) => {
  const session: Session | null = event.sharedMap.get("session");
  if (!session || new Date(session.expires) < new Date()) {
    throw event.redirect(302, `/login`);
  }
};

export default component$(() => {
  const session = useAuthSession();
  const userId = getGithubUserIdFromUserImage(session.value!.user!.image!);

  const state = useStore({
    gameID,
    dayID,
    buttonPresses: 0,
  });

  const xtremeXmasUserDataResource = useResource$<any>(
    async ({ track, cleanup }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const gameID = track(() => state.gameID);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dayID = track(() => state.dayID);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const buttonPresses = track(() => state.buttonPresses);

      const abortController = new AbortController();
      cleanup(() => abortController.abort("cleanup"));
      const userData = await serverFetcher(`userdata`, "GET", userId);
      if (userData.Game.length < 1) {
        return { numberOfGames: JSON.stringify(userData.Game.length) };
      }
      return {
        numberOfGames: JSON.stringify(userData.Game.length),
        userData,
      };
    }
  );

  return (
    <div>
      <div>
        <h1 class="title">Calendar</h1>
        <Resource
          value={xtremeXmasUserDataResource}
          onPending={() => {
            return (
              <div>
                <strong>Loading...</strong>
              </div>
            );
          }}
          onResolved={(xtremeXmasData) => {
            console.log(xtremeXmasData.userData.Game);
            if (+xtremeXmasData.numberOfGames < 1) {
              return (
                <div>
                  <h2>
                    Please <a href="/new">[Start a New Game!]</a>
                  </h2>
                </div>
              );
            }

            return (
              <>
                <a href="/game">[Click Here!]</a>
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