import { DeviceType } from "../enums/device-type";
import { OsName } from "../enums/os-name";

export function getOsNameFromUserAgent(userAgent: string): OsName {
  if (
    /iPad/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent))
  ) {
    return OsName.IpadOs;
  }

  if (/iPhone|iPod/.test(userAgent)) {
    return OsName.Ios;
  }

  if (/Android/.test(userAgent)) {
    return OsName.Android;
  }

  if (/CrOS/.test(userAgent)) {
    return OsName.ChromeOs;
  }

  if (/Windows NT/.test(userAgent)) {
    return OsName.Windows;
  }

  if (/Mac OS X|Macintosh/.test(userAgent)) {
    return OsName.MacOs;
  }

  if (/Linux|X11/.test(userAgent)) {
    return OsName.Linux;
  }

  return OsName.Unknown;
}

export function getDeviceTypeFromUserAgent(userAgent: string): DeviceType {
  if (/bot|crawler|spider|crawling|HeadlessChrome/i.test(userAgent)) {
    return DeviceType.Bot;
  }

  if (/SmartTV|GoogleTV|HbbTV|TV/.test(userAgent)) {
    return DeviceType.Tv;
  }

  if (
    /iPad|Tablet|PlayBook|Silk/.test(userAgent) ||
    (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) ||
    (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent))
  ) {
    return DeviceType.Tablet;
  }

  if (/Mobi|iPhone|iPod|Mobile|Windows Phone/.test(userAgent)) {
    return DeviceType.Mobile;
  }

  if (getOsNameFromUserAgent(userAgent) !== OsName.Unknown) {
    return DeviceType.Desktop;
  }

  return DeviceType.Unknown;
}
