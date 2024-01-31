import Ajv from "ajv";

const ajv = new Ajv();

const schema = {
  type: "object",
  properties: {
    startDate: { type: "number" },
  },
  required: ["startDate"],
  additionalProperties: false,
};

export class Settings {
  public startDate: number;
  constructor() {
    this.startDate = Date.now();

    // console.log("this:", this);
    if (!ajv.validate(schema, this))
      throw new Error("Invalid Settings: " + JSON.stringify(this));
  }
}
