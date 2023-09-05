import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { rollChallengeModifier } from "./components/rollChallengeModifier.ts";
import {
  createGame,
  deleteGame,
  getAllGames,
  getDayById,
  getDaysByGameId,
  getGameById,
} from "./db.ts";
import { DayController } from "./components/DayController.ts";

const app = new Application();
const router = new Router();

router
  /**
   * Hello World!
   */
  .get("/", (context) => {
    context.response.body =
      "You have successfully pinged the Advent Of Code QSL's Mod API!";
  })
  /**
   * Get All Games (eventually will be Continue Game)
   */
  .get("/game", (context) => {
    context.response.body = getAllGames();
  })
  /**
   * Resume Game
   */
  .get("/game/:id", (context) => {
    const { id } = context.params;
    context.response.body = getGameById(+id);
  })
  /**
   * Start New Game
   */
  .post("/game", async (context) => {
    const { name, playerName, year } = await context.request.body({
      type: "json",
    })
      .value;
    context.response.body = createGame(name, playerName, year);
  })
  /**
   * Delete Game
   */
  .delete("/game/:id", (context) => {
    const { id } = context.params;
    context.response.body = deleteGame(+id);
  })
  /**
   * Get All Days for a Game
   */
  .get("/game/:id/day", (context) => {
    const { id } = context.params;
    context.response.body = getDaysByGameId(+id);
  })
  /**
   * Get a Day
   */
  .get("/day/:id", (context) => {
    const { id } = context.params;
    context.response.body = getDayById(+id);
  })
  /**
   * Roll initial Challenge Modifier
   */
  .get("day/:id/roll/initial", async (context) => {
    const { id } = context.params;
    const day = await getDayById(+id);
    DayController(day!).rollInitialChallengeModifier();
    context.response.body = day;
  })
  /**
   * Reroll Challenge Modifier
   */
  .get("day/:id/roll/reroll_challenge_modifier", async (context) => {
    const { id } = context.params;
    const day = await getDayById(+id);
    DayController(day!).rerollChallengeModifier();
    context.response.body = day;
  })
  /**
   * Reroll Modifier Option
   */
  .get("day/:id/roll/reroll_modifier_option", async (context) => {
    const { id } = context.params;
    const day = await getDayById(+id);
    DayController(day!).rerollModifierOption();
    context.response.body = day;
  })
  /**
   * Complete Part 1
   */
  .get("day/:id/complete_part_1", async (context) => {
    const { id } = context.params;
    const day = await getDayById(+id);
    DayController(day!).completePart1();
    context.response.body = day;
  })
  /**
   * Complete Part 2
   */
  .get("day/:id/complete_part_2", async (context) => {
    const { id } = context.params;
    const day = await getDayById(+id);
    DayController(day!).completePart2();
    context.response.body = day;
  })
  /**
   * Roll a Challenge Modifier
   */
  .get("/roll/challenge_modifier", (context) => {
    context.response.body = rollChallengeModifier();
  });

app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server running on http://localhost:8000`);

await app.listen({ port: 8000 });
