import { Fragment } from "react";

/**
 * 和文の改行位置を明示するための表示コンポーネント。
 *
 * データ側は素のテキストのまま保ち、改行したい位置にだけ "\n" を置く。
 * 表示時にここで <br /> へ変換する。
 * こうすることで、同じ文字列を構造化データ・alt・meta で再利用してもタグが混ざらない。
 *
 * 日本語は単語間に空白が無くどこでも改行できるため、自然折り返しに任せると
 * 「必要な工事と」/「選べる方法を…」のように文節の途中で割れる。
 * 改行位置は **「。」「、」の直後だけ** に置くこと。
 * 句読点の無い位置に改行を入れると、必ず文節の途中で切れて行末に助詞が残る。
 *
 * 使い方:
 *   <p><WrapText text={"ご相談から施工まで、\n一貫して対応します。"} /></p>
 */
export function WrapText({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
