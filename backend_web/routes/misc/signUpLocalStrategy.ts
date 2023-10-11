import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { createUser } from "../../db.ts";
import { Context, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export const signUpLocalStrategy = async (ctx: Context, next: Next) => {
  try {
    const body = await ctx.request.body().value;
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(body.get("password")!, salt);
    const user = await createUser(
      Math.floor(Math.random() * 1000000000).toString(),
      body.get("username")!,
      hashedPassword,
    );
    const _result = user;
    ctx.response.status = 201;
    ctx.response.body = {
      message: "User created",
      userId: user.id,
      user: user.username,
    };
  } catch (_err) {
    return next;
  }
};