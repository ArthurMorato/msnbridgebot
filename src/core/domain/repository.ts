import { Message } from "./entities/message";
import { GroupMapping } from "./entities/group-mapping";
import { Platform } from "./value-objects/platform";

export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}

export interface IMessageRepository extends IRepository<Message, string> {
  findByOriginId(originId: string, platform: Platform): Promise<Message | null>;
  findByGroupId(groupId: string, limit?: number): Promise<Message[]>;
  findFailedMessages(threshold: number): Promise<Message[]>;
}

export interface IGroupMappingRepository extends IRepository<GroupMapping, string> {
  findByTelegramGroupId(groupId: string): Promise<GroupMapping | null>;
  findByWhatsappGroupId(groupId: string): Promise<GroupMapping | null>;
  findByPlatformGroupId(platform: Platform, groupId: string): Promise<GroupMapping | null>;
  findActiveMappings(): Promise<GroupMapping[]>;
}
