export type MobileBleCharacteristicProperties = {
  broadcast?: boolean;
  read?: boolean;
  writeWithoutResponse?: boolean;
  write?: boolean;
  notify?: boolean;
  indicate?: boolean;
  authenticatedSignedWrites?: boolean;
  reliableWrite?: boolean;
  writableAuxiliaries?: boolean;
  extendedProperties?: boolean;
  notifyEncryptionRequired?: boolean;
  indicateEncryptionRequired?: boolean;
};

export type MobileBleDescriptor = {
  uuid: string;
};

export type MobileBleCharacteristic = {
  uuid: string;
  properties: MobileBleCharacteristicProperties;
  descriptors: MobileBleDescriptor[];
};

export type MobileBleService = {
  uuid: string;
  characteristics: MobileBleCharacteristic[];
};
