import { Body,Controller,Get,Inject,Param,Patch,Post,Req,UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../identity/auth-context'; import { AuthGuard } from '../identity/auth.guard'; import { PermissionGuard,RequiresPermission } from '../identity/permission.guard'; import { MediaService } from './media.service';
@Controller('vendors/businesses/:businessId/media') @UseGuards(AuthGuard)
export class VendorMediaController { constructor(@Inject(MediaService)private readonly media:MediaService){}
 @Post('upload-intents')intent(@Req()r:AuthenticatedRequest,@Param('businessId')b:string,@Body()x:unknown){return this.media.signedUpload(r.auth.userId,b,x)}
 @Post('upload-intents/:intentId/complete')complete(@Req()r:AuthenticatedRequest,@Param('businessId')b:string,@Param('intentId')i:string){return this.media.complete(r.auth.userId,b,i)}
 @Post('retry/:mediaId')retry(@Req()r:AuthenticatedRequest,@Param('businessId')b:string,@Param('mediaId')m:string){return this.media.retry(r.auth.userId,b,m)} }
@Controller('vendors/businesses/:businessId/portfolio') @UseGuards(AuthGuard)
export class VendorPortfolioController {constructor(@Inject(MediaService)private readonly media:MediaService){}
 @Post()create(@Req()r:AuthenticatedRequest,@Param('businessId')b:string,@Body()x:unknown){return this.media.createPost(r.auth.userId,b,x)}
 @Post(':postId/publish')publish(@Req()r:AuthenticatedRequest,@Param('businessId')b:string,@Param('postId')p:string){return this.media.publish(r.auth.userId,b,p)}
 @Patch(':postId/archive')archive(@Req()r:AuthenticatedRequest,@Param('businessId')b:string,@Param('postId')p:string){return this.media.archive(r.auth.userId,b,p)} }
@Controller('admin/media') @UseGuards(AuthGuard,PermissionGuard) @RequiresPermission('media.moderate')
export class MediaModerationController {constructor(@Inject(MediaService)private readonly media:MediaService){} @Get('queue')queue(){return this.media.moderationQueue()} @Post(':mediaId/decision')decision(@Req()r:AuthenticatedRequest,@Param('mediaId')m:string,@Body()x:unknown){return this.media.moderate(r.auth.userId,m,x)} }
@Controller('public') export class PublicPortfolioController {constructor(@Inject(MediaService)private readonly media:MediaService){} @Get('vendors/:slug/portfolio')portfolio(@Param('slug')s:string){return this.media.publicPortfolio(s)} @Post('copyright-reports')copyright(@Body()x:unknown){return this.media.reportCopyright(x)} }
