# RTO Shield

RTO Shield is an AI-assisted RTO decision layer for simulated merchant transactions.

## Runtime Architecture

`Transaction -> canonical payload -> Python feature normalizer -> Gradient Boosting artifact -> RTO probability -> risk/intervention/checkout/exposure`

The Express API delegates `/api/ml/rto-predict` to `ml/predict.py`. When `ml/models/rto_model.joblib` is present, that service loads the primary artifact. This checkout does not contain the artifact, so the API explicitly returns `modelSource: deterministic_fallback` and the UI labels that path. No fallback probability is presented as a trained-model result.

The evaluation metadata comes from the held-out test set in `ml/data/test.csv`. Run `python ml/evaluate.py` for metrics and threshold analysis. Current evaluation uses synthetic transaction data; production calibration requires representative merchant transaction and RTO outcome data.

Start the app with `npm run dev` and the API with `npm run server`.

## Original Template Notes

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
