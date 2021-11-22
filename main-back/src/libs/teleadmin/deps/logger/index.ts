import winston, { Logger as WLogger } from "winston";

export type Logger = WLogger;

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

  return winston.createLogger({
    level,
    format: devFormat,
    defaultMeta: { service },
    transports: [new winston.transports.Console()],
  });
};
