import winston, { Logger } from "winston";

export let appLogger: Logger;

export const initAppLogger = (level: string, service: string): Logger => {
  const devFormat = winston.format.combine(
    winston.format.colorize({
      all: true,
    }),
    winston.format.label({
      label: "[LOGGER]",
    }),
    winston.format.timestamp({
      format: "YY-MM-DD HH:MM:SS",
    }),
    winston.format.printf(
      (info) =>
        ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`
    )
  );

  appLogger = winston.createLogger({
    level,
    format: devFormat,
    defaultMeta: { service },
    transports: [new winston.transports.Console()],
  });

  return appLogger;
};
