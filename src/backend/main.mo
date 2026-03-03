import Prim "mo:prim";

actor {
  // No-op backend for pure frontend game
  public query func ping() : async Text {
    return "pong";
  };
};
