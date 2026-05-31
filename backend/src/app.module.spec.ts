describe('AppModule', () => {
  it('module file exists and exports AppModule', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AppModule } = require('./app.module');
    expect(AppModule).toBeDefined();
  });
});
