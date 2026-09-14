import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetPublicMenuUseCase } from "../application/get-public-menu.use-case";
import { PublicMenuV3Dto } from "./public-menu-v3.dto";

@ApiTags("menu-v3")
@Controller("api/v3/public/menu")
export class PublicMenuV3Controller {
  constructor(private readonly getPublicMenu: GetPublicMenuUseCase) {}

  @Get()
  @Header("Cache-Control", "no-store")
  @ApiOperation({
    summary: "Получить публичное меню с ценами и подписями порций",
  })
  @ApiResponse({ status: 200, type: PublicMenuV3Dto })
  async getMenu(): Promise<PublicMenuV3Dto> {
    return this.getPublicMenu.executeV3();
  }
}
