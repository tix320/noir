import { User } from "./user";

export const USERS = [
    new User("3c1af001-b01b-4b47-86ba-cfe69a973aec", "test1"),
    new User("793faf1b-fa15-402a-9dc4-74c6c73ac902", "test2"),
    new User("74cfa6c5-4ac8-4d86-b4b6-c0b2b1d701f6", "test3"),
    new User("f23b6b62-ade6-4a69-aa8c-92715d58a903", "test4"),
    new User("75b4d46f-1b05-4f84-9f87-ee5bb99ec59e", "test5"),
    new User("faebb422-ff1e-4a96-9f73-8e08f448ee91", "test6"),
    new User("1f09de5f-a90b-4fc0-919a-ee285683534d", "test7"),
    new User("ed915650-b10f-4080-8b6f-9ad72da4b8ce", "tix320"),
    new User("e14b8127-b69c-4642-bcc4-e4416cd5b7aa", "Reserved"),
    new User("c601adfd-70f1-4e6e-b9a6-49120cbde7c5", "Reserved"),
    new User("ac64dc8f-2e56-4856-8719-9ee63b2e5a63", "Reserved"),
]

export const USERS_BY_TOKEN: Map<string, User> = USERS.reduce((map, user) => {
    map.set(user.id, user);
    return map;
}, new Map());