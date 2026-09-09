export async function transcodeVideo(input: Buffer): Promise<{ video: Buffer; thumbnail: Buffer }> {
  void input;
  throw new Error('Video transcoder is not configured');
}
