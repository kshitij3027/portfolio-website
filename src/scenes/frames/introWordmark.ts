import { OWNER } from '../../orchestration/copy';
import { rule, text, type Ctx } from '../kit';

const CX = 1400;

const INTRO_LIST = ['AI-savvy Learner', 'Product Minded Builder'] as const;

export function drawIntro(ctx: Ctx): void {
  text(ctx, CX, 620, OWNER.firstName, {
    px: 236,
    font: 'sans',
    weight: 900,
    ink: 245,
    align: 'center',
    spacing: 6,
  });
  text(ctx, CX, 870, OWNER.lastName, {
    px: 236,
    font: 'sans',
    weight: 900,
    ink: 245,
    align: 'center',
    spacing: 6,
  });
  text(ctx, CX, 972, OWNER.title, {
    px: 44,
    font: 'mono',
    weight: 700,
    ink: 195,
    align: 'center',
    spacing: 16,
  });
  rule(ctx, CX - 260, 1022, 520, 120, 3);

  INTRO_LIST.forEach((item, i) => {
    text(ctx, CX, 1126 + i * 88, item, {
      px: 46,
      font: 'sans',
      weight: 600,
      ink: 225,
      align: 'center',
    });
  });
}

export function drawOutro(ctx: Ctx): void {
  text(ctx, CX, 760, OWNER.name, {
    px: 150,
    font: 'sans',
    weight: 900,
    ink: 245,
    align: 'center',
    spacing: 4,
  });
  text(ctx, CX, 872, `${OWNER.githubHandle} · ${OWNER.email}`, {
    px: 40,
    font: 'mono',
    weight: 700,
    ink: 195,
    align: 'center',
  });
  rule(ctx, CX - 260, 930, 520, 120, 3);
}
