import UssdMenu from "ussd-menu-builder";
import { redis } from "..";
import {
  checkIfSessionExists,
  getSessionAsJson,
  sendToTheServer,
} from "./functions";

//ussd flow
let menu = new UssdMenu({
  provider: "africasTalking",
});

//common message
let finalMessage =
  "Your order is successfully completed!" +
  "\nService Provider(s) will contact you shortly." +
  "\nWelcome to MAMAKAZI FAMILY!";

// Define menu states
menu.startState({
  run: async () => {
    // check if session exists
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      await redis.set(menu.args.sessionId, JSON.stringify({}), "EX", 5 * 60); //Expiring in 5 minutes
    }

    // use menu.con() to send response without terminating the session
    menu.con(
      "Welcome to MAMA KAZI APP" +
        "\n Your quality home-care partner; 0706291676" +
        "\n1. Laundry" +
        "\n2. House Cleaning" +
        "\n3. Elite Cleaners" +
        "\n4. Fumigation" +
        "\n5. Mama Fua Academy" +
        "\n6. Monthly MAMAFUA" +
        "\n7. Mama Kazi Chama" +
        "\n00. Exit"
    );
  },

  // next object links to next state based on user input
  next: {
    "1": "laundry",
    "2": "houseCleaning",
    "3": "eliteCleaners",
    "4": "fumigation",
    "5": "mamaFuaAcademy",
    "6": "monthlyMamaFua",
    "7": "mamakaziChama",
    "00": "quit",
  },
});

// start of laundry services
menu.state("laundry", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    let newData = {
      service: "1",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to Laundry Services" + "\n1. Home-Wash" + "\n2. Laundromat"
    );
  },
  next: {
    "1": "homeWash",
    "2": "laundromat",
    "0": "__start__",
  },
});

// start of homewash of the laundry
menu.state("homeWash", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const newData = {
      service: "1",
      type: "1",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to Home Wash Services" +
        "\n Enter number of baskets" +
        "\n 0. Back"
    );
  },
  next: {
    "*\\d+": "homeWash.location",
    "0": "__start__",
  },
});

menu.state("homeWash.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["noOfbaskets"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "homewash.moreOnLocation",
    "2": "homewash.moreOnLocation",
    "3": "homewash.moreOnLocation",
    "4": "homewash.moreOnLocation",
    "0": "homeWash",
  },
});

menu.state("homewash.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "homeWash.date",
    "0": "homeWash.location",
  },
});

menu.state("homeWash.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter date for pick up" + "\n format: DD/MM/YYY" + "\n 0. Back");
  },
  next: {
    "*\\d+": "homeWash.time",
    "0": "homeWash.location",
  },
});

menu.state("homeWash.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter time for pick up" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "homeWash.end",
    "0": "homeWash.date",
  },
});

// end of the ussd flow
menu.state("homeWash.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

// start of laundromat services of the laundry
menu.state("laundromat", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const newData = {
      service: "1",
      type: "2",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to Laundromat Services" +
        "\n Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "laundromat.moreOnLocation",
    "2": "laundromat.moreOnLocation",
    "3": "laundromat.moreOnLocation",
    "4": "laundromat.moreOnLocation",
    "0": "laundry",
  },
});

menu.state("laundromat.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "laundromat.date",
    "0": "laundromat.location",
  },
});

menu.state("laundromat.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter date for pick up" + "\n format: DD/MM/YYY" + "\n 0. Back");
  },
  next: {
    "*\\d+": "laundromat.time",
    "0": "laundromat",
  },
});

menu.state("laundromat.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter time for pick up" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "laudromat.end",
    "0": "laundromat.date",
  },
});

// end of the ussd flow
menu.state("laudromat.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

//start of house cleaning
menu.state("houseCleaning", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    let newData = {
      service: "2",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to House Cleaning!" +
        "\n Enter the number of rooms(Ksh.250/room)" +
        "\n 0. Back"
    );
  },
  next: {
    "*\\d+": "houseCleaning.rooms",
    "0": "__start__",
  },
});

menu.state("houseCleaning.rooms", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["noOfRooms"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter Your Name" + "\n 00. Back");
  },
  next: {
    "*[a-zA-Z]+": "houseCleaning.name",
    "00": "__start__",
  },
});

menu.state("houseCleaning.name", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["name"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 00. Home"
    );
  },
  next: {
    "1": "houseCleaning.location",
    "2": "houseCleaning.location",
    "3": "houseCleaning.location",
    "4": "houseCleaning.location",
    "00": "__start__",
  },
});

menu.state("houseCleaning.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter More on your location" + "\n 00. Back");
  },
  next: {
    "*[a-zA-Z]+": "houseCleaning.moreOnLocation",
    "00": "__start__",
  },
});

menu.state("houseCleaning.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter date" + "\n format: DD/MM/YYY" + "\n 00. Back");
  },
  next: {
    "*\\d+": "houseCleaning.date",
    "00": "__start__",
  },
});

menu.state("houseCleaning.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter time" + "\n format: hh:mm" + "\n 00. Back");
  },
  next: {
    "*\\d+": "houseCleaning.time",
    "00": "__start__",
  },
});

menu.state("houseCleaning.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

// start of elite cleaners services
menu.state("eliteCleaners", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    let newData = {
      service: "3",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to Elite Cleaners" +
        "\n1. Deep house cleaning" +
        "\n2. Seat cleaning" +
        "\n3. Carpet cleaning" +
        "\n4. Washrooms & Sinks" +
        "\n 0. Back"
    );
  },

  next: {
    "1": "eliteCleaners.deepHouseCleaning",
    "2": "eliteCleaners.seatCleaning",
    "3": "eliteCleaners.carpetCleaning",
    "4": "eliteCleaners.sinkAndWashrooms",
    "0": "__start__",
  },
});

// start of deep house cleaning services in the elite cleaners services
menu.state("eliteCleaners.deepHouseCleaning", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const newData = {
      service: "3",
      type: "1",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));
    menu.con(
      "Deep house cleaning services" +
        "\n1. 1 room @ Ksh 4000" +
        "\n2. 1 bedroom @ Ksh 6000" +
        "\n3. 2 bedroom @ Ksh 8000" +
        "\n4. 3 bedroom @ Ksh 10000" +
        "\n5. 4 bedroom @ Ksh 14000" +
        "\n6. 5 bedroom @ Ksh 18500" +
        "\n6. 6 bedroom @ Ksh 21000" +
        "\n7. 7 bedroom @ Ksh 25000" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.deepHouseCleaning.houseSize",
    "2": "eliteCleaners.deepHouseCleaning.houseSize",
    "3": "eliteCleaners.deepHouseCleaning.houseSize",
    "4": "eliteCleaners.deepHouseCleaning.houseSize",
    "5": "eliteCleaners.deepHouseCleaning.houseSize",
    "6": "eliteCleaners.deepHouseCleaning.houseSize",
    "7": "eliteCleaners.deepHouseCleaning.houseSize",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.deepHouseCleaning.houseSize", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["houseSize"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.deepHouseCleaning.moreOnLocation",
    "2": "eliteCleaners.deepHouseCleaning.moreOnLocation",
    "3": "eliteCleaners.deepHouseCleaning.moreOnLocation",
    "4": "eliteCleaners.deepHouseCleaning.moreOnLocation",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.deepHouseCleaning.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "eliteCleaners.deepHousingCleaning.date",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.deepHousingCleaning.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter date" + "\n format: DD/MM/YYY" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.deepHousingCleaning.time",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.deepHousingCleaning.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter time" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.deepHousingCleaning.end",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.deepHousingCleaning.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

// start of seat cleaning services in the elite cleaners services
menu.state("eliteCleaners.seatCleaning", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const newData = {
      service: "3",
      type: "2",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con("Seat cleaning services" + "\n No of seats " + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.seatCleaning:noOfSeats",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.seatCleaning:noOfSeats", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["noOfSeats"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.seatCleaning.moreOnLocation",
    "2": "eliteCleaners.seatCleaning.moreOnLocation",
    "3": "eliteCleaners.seatCleaning.moreOnLocation",
    "4": "eliteCleaners.seatCleaning.moreOnLocation",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.seatCleaning.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "eliteCleaners.seatCleaning.date",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.seatCleaning.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter date" + "\n format: DD/MM/YYY" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.seatCleaning.time",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.seatCleaning.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter time" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.seatCleaning.end",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.seatCleaning.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

// start of carpet cleaning services in the elite cleaners services
menu.state("eliteCleaners.carpetCleaning", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const newData = {
      service: "3",
      type: "3",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));
    menu.con(
      "Carpet cleaning services" +
        "\n1. Medium size @ Ksh 1500 " +
        "\n2. Large size @ Ksh 2000 " +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.carpetCleaning.carpetSize",
    "2": "eliteCleaners.carpetCleaning.carpetSize",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.carpetCleaning.carpetSize", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["carpetSize"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.carpetCleaning.moreOnLocation",
    "2": "eliteCleaners.carpetCleaning.moreOnLocation",
    "3": "eliteCleaners.carpetCleaning.moreOnLocation",
    "4": "eliteCleaners.carpetCleaning.moreOnLocation",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.carpetCleaning.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "eliteCleaners.carpetCleaning.date",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.carpetCleaning.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter date" + "\n format: DD/MM/YYY" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.carpetCleaning.time",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.carpetCleaning.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter time" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.carpetCleaning.end",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.carpetCleaning.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(
        "Awesome. We will send you a confirmation message shortly. Thank you!"
      );
    } catch {
      menu.end(finalMessage);
    }
  },
});

// start of washrooms
menu.state("eliteCleaners.sinkAndWashrooms", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const newData = {
      service: "3",
      type: "4",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));
    menu.con(
      "Select Either Washrooms, Sinks or Both" +
        "washrooms @ Ksh1500 and Sinks @ Ksh700" +
        "\n1. Washrooms" +
        "\n2. Sinks" +
        "\n3. Both" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.sinkAndWashrooms.selectWashrooms",
    "2": "eliteCleaners.sinkAndWashrooms.selectSinks",
    "3": "eliteCleaners.sinkAndWashrooms.selectBoth",
    "0": "eliteCleaners",
  },
});

// start of deep cleaning washrooms number in the elite cleaners services
menu.state("eliteCleaners.sinkAndWashrooms.selectWashrooms", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["choice"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter number of washrooms" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.sinkAndWashrooms.noOfWashrooms",
    "0": "eliteCleaners",
  },
});
// start of deep cleaning washrooms number in the elite cleaners services
menu.state("eliteCleaners.sinkAndWashrooms.selectSinks", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["choice"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter number of Sinks" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.sinkAndWashrooms.noOfSinks",
    "0": "eliteCleaners",
  },
});
// start of deep cleaning washrooms number in the elite cleaners services
menu.state("eliteCleaners.sinkAndWashrooms.selectBoth", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["choice"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Enter number of Washrooms and Sinks" +
        "\n Washrooms @ Ksh1500 and Sinks @ Ksh700" +
        "\n In the format 1,2 (washrooms,sinks)" +
        "\n 0. Back"
    );
  },
  next: {
    "*\\d+": "eliteCleaners.sinkAndWashrooms.bothWashroomsAndSinks",
    "0": "eliteCleaners",
  },
});

// start of deep cleaning washrooms number in the elite cleaners services
menu.state("eliteCleaners.sinkAndWashrooms.bothWashroomsAndSinks", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["noOfWashroomsAndSinks"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "2": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "3": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "4": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "0": "eliteCleaners",
  },
});

// start of deep cleaning washrooms number in the elite cleaners services
menu.state("eliteCleaners.sinkAndWashrooms.noOfSinks", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["noOfWashrooms"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "2": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "3": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "4": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "0": "eliteCleaners",
  },
});

// start of deep cleaning washrooms number in the elite cleaners services
menu.state("eliteCleaners.sinkAndWashrooms.noOfWashrooms", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["noOfWashrooms"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "2": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "3": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "4": "eliteCleaners.sinkAndWashrooms.moreOnLocation",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.sinkAndWashrooms.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "eliteCleaners.sinkAndWashrooms.date",
    "0": "eliteCleaners",
  },
});

menu.state("eliteCleaners.sinkAndWashrooms.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter date" + "\n format: DD/MM/YYY" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.sinkAndWashrooms.time",
    "0": "eliteCleaners.deepHouseCleaning",
  },
});
menu.state("eliteCleaners.sinkAndWashrooms.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter time" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "eliteCleaners.sinkAndWashrooms.end",
    "0": "eliteCleaners.deepHouseCleaning",
  },
});
menu.state("eliteCleaners.sinkAndWashrooms.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

// start of fumigation services
menu.state("fumigation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    let newData = {
      service: "4",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Select your house size for fumigation" +
        "\n1. Bedsitter @ kshs.2000" +
        "\n2. 1 bedroom @ kshs. 3000" +
        "\n3. 2 bedroom @ kshs. 4000" +
        "\n4. 3 bedroom @ kshs.4500" +
        "\n5. 4 bedroom @ kshs.5000" +
        "\n6. 5 bedroom @ kshs.6000" +
        "\n7. 6 bedroom @ kshs. 6500" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "fumigation.location",
    "2": "fumigation.location",
    "3": "fumigation.location",
    "4": "fumigation.location",
    "5": "fumigation.location",
    "6": "fumigation.location",
    "7": "fumigation.location",
    "0": "__start__",
  },
});

menu.state("fumigation.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["roomSize"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "fumigation.moreOnLocation",
    "2": "fumigation.moreOnLocation",
    "3": "fumigation.moreOnLocation",
    "4": "fumigation.moreOnLocation",
    "0": "fumigation",
  },
});

menu.state("fumigation.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["location"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "fumigation.date",
    "0": "fumigation.location",
  },
});

// start of date for the fumigation services
menu.state("fumigation.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["moreOnLocation"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Enter date for fumigation" + "\n format: DD/MM/YYY" + "\n 0. Back"
    );
  },
  next: {
    "*\\d+": "fumigation.time",
    "0": "fumigation",
  },
});

// start of time for the fumigation services
menu.state("fumigation.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["date"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter time for fumigation" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "fumigation.end",
    "0": "fumigation.date",
  },
});

// end of the fumigation the ussd flow
menu.state("fumigation.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);

    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

// start of mama fua academy services
menu.state("mamaFuaAcademy", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "5",
    };
    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to Mama Fua Academy" +
        "\n1. Book Training" +
        "\n2. Sponsor a Mama Fua for training" +
        "\n0. Back"
    );
  },
  next: {
    "1": "bookTraining.name",
    "2": "sponsor.name",
    "0": "__start__",
  },
});

// start of book training
menu.state("bookTraining.name", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "5",
      serviceType: "1",
    };
    await redis.set(menu.args.sessionId, JSON.stringify(newData));
    menu.con("Enter your name" + "\n0. Back");
  },
  next: {
    "*[a-zA-Z]+": "bookTraining.location",
    "0": "mamaFuaAcademy",
  },
});

menu.state("bookTraining.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["name"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "bookTraining.moreOnLocation",
    "2": "bookTraining.moreOnLocation",
    "3": "bookTraining.moreOnLocation",
    "4": "bookTraining.moreOnLocation",
    "0": "mamaFuaAcademy",
  },
});

menu.state("bookTraining.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["location"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "bookTraining.idNumber",
    "0": "bookTraining.location",
  },
});

// start of book training -> users -> location -> id number
menu.state("bookTraining.idNumber", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["moreOnLocation"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter your ID number" + "\n0. Back");
  },
  next: {
    "*\\d+": "bookTraining.disclaimer",
    "0": "bookTraining.location",
  },
});

// start of book training -> users -> location -> id number -> disclaimer
menu.state("bookTraining.disclaimer", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["idNumber"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con(
      "Fee between 2500-5000.Please pay deposit of Kshs.1000." +
        "\n If yes press (1) to proceed, press (2) to cancel (0) to go back" +
        "\n1. Yes" +
        "\n2. No" +
        "\n0. Back"
    );
  },
  next: {
    1: "bookTraining.end",
    2: "quit",
    "0": "bookTraining.idNumber",
  },
});

menu.state("bookTraining.end", {
  run: async () => {
    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(
        "Registration is complete and received." +
          "Mama Kazi Team will provide payment shortly. Thank you!"
      );
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

// start of sponsor a mama fua for training
menu.state("sponsor.name", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "5",
      serviceType: "2",
    };
    await redis.set(menu.args.sessionId, JSON.stringify(newData));
    menu.con("Enter your name or Organization" + "\n0. Back");
  },
  next: {
    "*[a-zA-Z]+": "sponsor.location",
    "0": "mamaFuaAcademy",
  },
});

menu.state("sponsor.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["sponsorName"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "sponsor.moreOnLocation",
    "2": "sponsor.moreOnLocation",
    "3": "sponsor.moreOnLocation",
    "4": "sponsor.moreOnLocation",
    "0": "mamaFuaAcademy",
  },
});

menu.state("sponsor.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["sponsorLocation"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "sponsor.disclaimer",
    "0": "sponsor.location",
  },
});

menu.state("sponsor.disclaimer", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["sponsorMoreOnLocation"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con(
      "The total fee is 2500, but you can contribute any amount" +
        "\n Would you like to sponsor a Mama Fua for training?" +
        "\n1. Yes" +
        "\n2. No" +
        "\n0. Back"
    );
  },
  next: {
    "1": "sponsor.end",
    "2": "mamaFuaAcademy",
    "0": "sponsor.phone",
  },
});

// end of the sponsor a mama fua for training
menu.state("sponsor.end", {
  run: async () => {
    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(
        "Dignifying the next generation of women, all thanks to you." +
          "\n MAMA KAZI TEAM will be communicating the payment details shortly." +
          "\n Thank you!"
      );
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

menu.state("mamakaziChama", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "6",
    };
    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to Mama Kazi Chama" +
        "\n1. Register" +
        "\n2. Merry Go Round" +
        "\n3. Asset Chama" +
        "\n0. Back"
    );
  },
  next: {
    "1": "mamakaziChama.register",
    "2": "mamakaziChama.merryGoRound",
    "3": "mamakaziChama.assetChama",
    "0": "__start__",
  },
});

menu.state("mamakaziChama.register", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "6",
      serviceType: "1",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con("Enter your Full Name" + "\n0. Back");
  },
  next: {
    "*[a-zA-Z]+": "mamakaziChama.register.location",
    "0": "mamakaziChama",
  },
});

menu.state("mamakaziChama.register.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["name"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "mamakaziChama.register.moreOnLocation",
    "2": "mamakaziChama.register.moreOnLocation",
    "3": "mamakaziChama.register.moreOnLocation",
    "4": "mamakaziChama.register.moreOnLocation",
    "0": "mamakaziChama.register",
  },
});

menu.state("mamakaziChama.register.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["location"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "mamakaziChama.register.idNumber",
    "0": "mamakaziChama.register.location",
  },
});

menu.state("mamakaziChama.register.idNumber", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["moreOnLocation"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter your ID number" + "\n0. Back");
  },
  next: {
    "*\\d+": "mamakaziChama.register.nextOfKinPhone",
    "0": "mamakaziChama.register.location",
  },
});

menu.state("mamakaziChama.register.nextOfKinPhone", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["idNumber"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter your next of kin phone number" + "\n0. Back");
  },
  next: {
    "*\\d+": "mamakaziChama.register.end",
    "0": "mamakaziChama.register.idNumber",
  },
});

menu.state("mamakaziChama.register.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["nextOfKinPhone"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(
        "Registration is successfully completed," +
          "\n Mama Kazi Team will reach out at the earliest convenience."
      );
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

menu.state("mamakaziChama.merryGoRound", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "6",
      serviceType: "2",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con("Enter your Full Name" + "\n0. Back");
  },
  next: {
    "*[a-zA-Z]+": "mamakaziChama.merryGoRound.location",
    "0": "mamakaziChama",
  },
});

menu.state("mamakaziChama.merryGoRound.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["name"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "mamakaziChama.merryGoRound.moreOnLocation",
    "2": "mamakaziChama.merryGoRound.moreOnLocation",
    "3": "mamakaziChama.merryGoRound.moreOnLocation",
    "4": "mamakaziChama.merryGoRound.moreOnLocation",
    "0": "mamakaziChama.merryGoRound",
  },
});

menu.state("mamakaziChama.merryGoRound.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["location"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "mamakaziChama.merryGoRound.idNumber",
    "0": "mamakaziChama.merryGoRound.location",
  },
});

menu.state("mamakaziChama.merryGoRound.idNumber", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["moreOnLocation"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter your ID number" + "\n0. Back");
  },
  next: {
    "*\\d+": "mamakaziChama.merryGoRound.amount",
    "0": "mamakaziChama.merryGoRound.location",
  },
});

menu.state("mamakaziChama.merryGoRound.amount", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["idNumber"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter the amount" + "\n0. Back");
  },
  next: {
    "*\\d+": "mamakaziChama.merryGoRound.end",
    "0": "mamakaziChama.merryGoRound.idNumber",
  },
});

menu.state("mamakaziChama.merryGoRound.end", {
  run: async () => {
    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(
        "Your request has successfully been received," +
          "Mama Kazi Team will reach out at the earliest convenience."
      );
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

menu.state("mamakaziChama.assetChama", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "6",
      serviceType: "3",
    };

    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con("Enter your Full Name" + "\n0. Back");
  },
  next: {
    "*[a-zA-Z]+": "mamakaziChama.assetChama.location",
    "0": "mamakaziChama",
  },
});

menu.state("mamakaziChama.assetChama.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["name"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "mamakaziChama.assetChama.moreOnLocation",
    "2": "mamakaziChama.assetChama.moreOnLocation",
    "3": "mamakaziChama.assetChama.moreOnLocation",
    "4": "mamakaziChama.assetChama.moreOnLocation",
    "0": "mamakaziChama.assetChama",
  },
});

menu.state("mamakaziChama.assetChama.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["location"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "mamakaziChama.assetChama.idNumber",
    "0": "mamakaziChama.assetChama.location",
  },
});

menu.state("mamakaziChama.assetChama.idNumber", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["moreOnLocation"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter your ID number" + "\n0. Back");
  },
  next: {
    "*\\d+": "mamakaziChama.assetChama.nextOfKinPhone",
    "0": "mamakaziChama.assetChama.location",
  },
});

menu.state("mamakaziChama.assetChama.nextOfKinPhone", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["idNumber"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter your next of kin phone number" + "\n0. Back");
  },
  next: {
    "*\\d+": "mamakaziChama.assetChama.end",
    "0": "mamakaziChama.assetChama.idNumber",
  },
});

//end
menu.state("mamakaziChama.assetChama.end", {
  run: async () => {
    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(
        "Your request has successfully been received," +
          "\nMama Kazi Team will reach out at the earliest convenience."
      );
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});

menu.state("monthlyMamaFua", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "7",
    };
    await redis.set(menu.args.sessionId, JSON.stringify(newData));

    menu.con(
      "Welcome to Monthly Mama Fua" +
        "\n1. Once a week @ Kshs.5000" +
        "\n2. Twice a week @ 6500" +
        "\n3. Three times a week @ 8500" +
        "\n4. Four times a week @ 14000" +
        "\n5. Five times a week @ 16000" +
        "\n0. Back"
    );
  },
  next: {
    "1": "monthlyMamaFua.name",
    "2": "monthlyMamaFua.name",
    "3": "monthlyMamaFua.name",
    "4": "monthlyMamaFua.name",
    "5": "monthlyMamaFua.name",
    "0": "__start__",
  },
});

menu.state("monthlyMamaFua.name", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    let newData = {
      service: "7",
      serviceType: "1",
    };
    await redis.set(menu.args.sessionId, JSON.stringify(newData));
    menu.con("Enter your Full Name" + "\n0. Back");
  },
  next: {
    "*[a-zA-Z]+": "monthlyMamaFua.location",
    "0": "monthlyMamaFua",
  },
});

menu.state("monthlyMamaFua.location", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["name"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con(
      "Pick your location" +
        "\n 1. Nairobi" +
        "\n 2. Mombasa" +
        "\n 3. Kisumu" +
        "\n 4. Eldoret" +
        "\n 0. Back"
    );
  },
  next: {
    "1": "monthlyMamaFua.moreOnLocation",
    "2": "monthlyMamaFua.moreOnLocation",
    "3": "monthlyMamaFua.moreOnLocation",
    "4": "monthlyMamaFua.moreOnLocation",
    "0": "monthlyMamaFua",
  },
});

menu.state("monthlyMamaFua.moreOnLocation", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["location"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter more on your location" + "\n 0. Back");
  },
  next: {
    "*[a-zA-Z]+": "monthlyMamaFua.date",
    "0": "monthlyMamaFua.location",
  },
});

//date and time
menu.state("monthlyMamaFua.date", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["moreOnLocation"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter date" + "\n format: DD/MM/YYY" + "\n 0. Back");
  },
  next: {
    "*\\d+": "monthlyMamaFua.time",
    "0": "monthlyMamaFua",
  },
});

menu.state("monthlyMamaFua.time", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }
    const d = await getSessionAsJson(menu.args.sessionId);
    d["date"] = menu.val;
    await redis.set(menu.args.sessionId, JSON.stringify(d));
    menu.con("Enter time" + "\n format: hh:mm" + "\n 0. Back");
  },
  next: {
    "*\\d+": "monthlyMamaFua.end",
    "0": "monthlyMamaFua.date",
  },
});

menu.state("monthlyMamaFua.end", {
  run: async () => {
    if (!(await checkIfSessionExists(menu.args.sessionId))) {
      menu.end("Session expired. Please start again.");
    }

    const d = await getSessionAsJson(menu.args.sessionId);
    d["time"] = menu.val;

    await redis.set(menu.args.sessionId, JSON.stringify(d));

    try {
      const res = await sendToTheServer(
        menu.args.sessionId,
        menu.args.phoneNumber
      );

      console.log(res);

      menu.end(finalMessage);
    } catch {
      menu.end(
        "An error occured when processing your request. Please try again later."
      );
    }
  },
});
// ussd quit
menu.state("quit", {
  run: () => {
    menu.end("Goodbye :)");
  },
});

// handle errors
menu.on("error", (err) => {
  //handle errors
  console.log(err);
  menu.end("An error occurred. Please try again later.");
});

export default menu;
