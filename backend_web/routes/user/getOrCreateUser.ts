import { createUser, getUserById } from "../../db.ts";
import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export const getOrCreateUser = async (ctx: Context, next: Next) => {
  try {
    const userId = ctx.state.session.get("userId") as string;
    let user;
    try {
      user = await getUserById(userId);
    } catch (_err) {
      user = await createUser(userId);
    }
    ctx.response.status = 201;
    ctx.response.body = {
      message: "User created",
      userId: user.id,
    };
  } catch (err) {
    console.log(err);
    return next;
  }
};