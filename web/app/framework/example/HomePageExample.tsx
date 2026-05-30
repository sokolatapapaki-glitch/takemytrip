"use client";

// =============================================================================
// FRAMEWORK USAGE EXAMPLE
// =============================================================================
// This file is reference material for agents and developers picking up the
// framework in a fresh project. It is NOT wired into any route — copy/paste
// what you need into app/page.tsx (or any other page) and adapt.
//
// It demonstrates every public primitive the framework currently ships:
//   1. useTable<T>(model)               — CRUD + relation helpers for a Prisma model
//   2. useAbsoluteModal() / useAlert()  — floating UI primitives from AppContext
//   3. DataForm                         — auto-generated create form from fieldConfig
//   4. GridLayout                       — drag-to-reorder list wrapper
//   5. ImageUpload / ImageGallery       — file uploads backed by the Image model
//   6. RichTextEditor                   — Tiptap editor wrapper
//   7. RelationRow                      — editable row + many-to-many relation linker
//
// Conventions you must follow when using these:
//   - The `table` prop is the Prisma model name in camelCase ("product",
//     "manyOne") — NOT PascalCase, NOT plural.
//   - The model must be registered in app/api/lib/models.ts so resolveModel()
//     accepts it. The generic [model]/* API routes handle every CRUD call.
//   - UI metadata (labels, placeholders, options, relationType) comes from
//     app/config/fieldConfig.ts. Without it, fields fall back to plain text.
//   - For many-to-many relations both sides need `relationType: "manyToMany"`
//     in fieldConfig so useTable's connect/disconnect can find the back-ref.
//
// See CLAUDE.md and the Obsidian vault Index.md for deeper docs.
// =============================================================================

import { useState } from "react";
import { useTable } from "@/framework/utils/useTable";
import { useAbsoluteModal } from "@/framework/ui/context/AppContext";
import { useAlert } from "@/framework/ui/useAlert";
import DataForm from "@/framework/data/DataForm";
import GridLayout from "@/framework/data/GridLayout";
import ImageUpload from "@/framework/data/image/ImageUpload";
import ImageGallery from "@/framework/data/image/ImageGallery";
import RichTextEditor from "@/framework/ui/RichTextEditor";
import EditInput from "@/framework/data/EditInput";
import CrudButton from "@/framework/data/buttons/CrudButton";
import RelationRow from "@/framework/data/RelationRow";

// -----------------------------------------------------------------------------
// All Prisma models below (Product / ManyOne / ManyTwo) are LOCAL STAND-INS for
// illustration only. They do NOT need to exist in prisma/schema.prisma for this
// file to compile. In a real project you would:
//   1. Add the model to prisma/schema.prisma
//   2. Re-export it from @/framework/types
//   3. Replace the local type below with `import type { Product } from "@/framework/types"`
// Until then, useTable("product") just returns an empty list at runtime and
// nothing renders — no errors, no crashes.
// -----------------------------------------------------------------------------
type Product = { id: number; name: string; price: number; position?: number };
type ManyOne = { id: number; name: string; ManyTwos?: ManyTwo[] };
type ManyTwo = { id: number; title: string; ManyOnes?: ManyOne[] };

// Inline product card kept inside the example so this file is self-contained
// (which is itself a deletable demo).
function ExampleProductCard({ product }: { product: Product }) {
  const { remove, isDeletingId, update } = useTable<Product>("product");
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-3 flex items-center gap-6">
      <EditInput value={product.name ?? ""} table="product" field="name" id={product.id} update={(data) => update(product.id, data)} />
      <EditInput value={product.price} table="product" field="price" id={product.id} update={(data) => update(product.id, data)} />
      <CrudButton
        type="delete"
        table="product"
        loading={isDeletingId(product.id)}
        onClick={() => remove(product.id)}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// AbsoluteModalExamples
// -----------------------------------------------------------------------------
// `useAbsoluteModal()` returns a controller for ONE floating panel. The trigger
// must spread `triggerProps` so the panel anchors to it. `toggle()` opens/closes
// with positioning (`side`, `align`) and the React node to render inside.
// `useAlert()` is the simpler screen-pinned toast — call `showAlert(title, msg)`.
// -----------------------------------------------------------------------------
function AbsoluteModalExamples() {
  const belowModal = useAbsoluteModal();
  const { showAlert } = useAlert();

  return (
    <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-700">Absolute modal examples</h2>
      <div className="flex flex-wrap gap-2">
        <button
          {...belowModal.triggerProps}
          type="button"
          onClick={() =>
            belowModal.toggle({
              side: "top",
              align: "end",
              component: (
                <div className="p-3 text-sm text-gray-700 bg-white rounded shadow-md">
                  <p className="font-medium mb-1">Below the button</p>
                  <p className="text-gray-500">side: "bottom" (default), align: "end".</p>
                  <button
                    type="button"
                    onClick={() => belowModal.close()}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Close this one
                  </button>
                </div>
              ),
            })
          }
          className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Open below
        </button>
        <button
          type="button"
          onClick={() => showAlert("Success", "Pinned to top-right of the screen!")}
          className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Pin to screen
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// HomePageExample
// -----------------------------------------------------------------------------
// One useTable() call per Prisma model you need on this page. It returns:
//   records          — current cached list (T[])
//   append(item)     — optimistic insert after a successful create (pass to DataForm.onSuccess)
//   update(id, data) — PATCH a row and update the cache
//   remove(id)       — DELETE a row and update the cache + back-refs
//   reorder(...)     — persist drag-reorder (wire to GridLayout.onReorder)
//   connect / disconnect(relationField, thisId, otherId) — many-to-many link/unlink
//   isDeletingId(id) — per-row delete spinner state
// -----------------------------------------------------------------------------
export default function HomePageExample() {
  const productData = useTable<Product>("product");
  const manyOneData = useTable<ManyOne>("manyOne");
  const manyTwoData = useTable<ManyTwo>("manyTwo");
  const [galleryKey, setGalleryKey] = useState(0);

  return (
    <div className="min-h-screen p-8">
      <AbsoluteModalExamples />
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* ImageUpload posts to the Image model. Bump a key on success so
            ImageGallery refetches and shows the new upload. */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">New Image</h2>
          <ImageUpload onUploaded={() => setGalleryKey((k) => k + 1)} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Uploaded Images</h2>
          <ImageGallery refreshKey={galleryKey} />
        </div>

        {/* RichTextEditor is a controlled-or-uncontrolled Tiptap wrapper.
            Pass `value` + `onChange` to control it, or omit for local state. */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Rich Text Editor</h2>
          <RichTextEditor placeholder="Start typing..." />
        </div>

        {/* DataForm auto-renders inputs from fieldConfig[table]. On a successful
            create it calls onSuccess(newRecord) — pipe it to useTable.append
            so the cache stays in sync without a refetch. */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">New Product</h2>
          <DataForm table="product" onSuccess={productData.append} />
        </div>

        {/* GridLayout wraps any list of cards. `layout` accepts "one-column",
            "two-column", etc. Pass useTable.reorder to onReorder to persist
            drag-and-drop order via the model's `position` field. */}
        <GridLayout title="Products" layout="one-column" table="product" onReorder={productData.reorder}>
          {productData.records.map((product) => (
            <ExampleProductCard key={product.id} product={product} />
          ))}
        </GridLayout>

        {/* RelationRow = EditInput (inline edit) + RelationLinker (m2m popover)
            + delete button. Reuse it for any model that has a scalar label
            field plus a many-to-many relation you want to manage inline.
            Type params are <ThisRecord, OtherRecord>. */}
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-700">Many One</h2>
          {manyOneData.records.map((manyOne) => (
            <RelationRow<ManyOne, ManyTwo>
              key={manyOne.id}
              record={manyOne}
              table="manyOne"
              labelField="name"
              otherTable="manyTwo"
              relationField="ManyTwos"
              renderRelationLabel={(item) => item.title}
              emptyMessage="No Many Two records"
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-700">Many Two</h2>
          {manyTwoData.records.map((manyTwo) => (
            <RelationRow<ManyTwo, ManyOne>
              key={manyTwo.id}
              record={manyTwo}
              table="manyTwo"
              labelField="title"
              otherTable="manyOne"
              relationField="ManyOnes"
              renderRelationLabel={(item) => item.name}
              emptyMessage="No Many One records"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
