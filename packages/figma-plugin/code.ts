figma.showUI(__html__, { visible: true, width: 300, height: 340 });

// --- Utility Functions ---

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function parseFills(
  fills: Array<{ type: string; color: string; opacity?: number }>
): Paint[] {
  return fills.map((f) => {
    const rgb = hexToRgb(f.color);
    return {
      type: "SOLID" as const,
      color: rgb,
      opacity: f.opacity ?? 1,
    };
  });
}

function serializeNode(node: SceneNode): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if ("x" in node) base.x = node.x;
  if ("y" in node) base.y = node.y;
  if ("width" in node) base.width = node.width;
  if ("height" in node) base.height = node.height;
  if ("opacity" in node) base.opacity = node.opacity;
  if ("fills" in node) base.fills = node.fills;
  if ("strokes" in node) base.strokes = node.strokes;
  if ("effects" in node) base.effects = node.effects;
  if ("cornerRadius" in node) base.cornerRadius = node.cornerRadius;
  if ("layoutMode" in node) base.layoutMode = node.layoutMode;

  if (node.type === "TEXT") {
    base.characters = node.characters;
    base.fontSize = node.fontSize;
  }

  return base;
}

function getNodeOrThrow(nodeId: string): SceneNode {
  const node = figma.getNodeById(nodeId);
  if (!node || node.type === "DOCUMENT" || node.type === "PAGE") {
    throw new Error(`NODE_NOT_FOUND: Node "${nodeId}" not found or is not a scene node`);
  }
  return node as SceneNode;
}

function appendToParent(node: SceneNode, parentId?: string): void {
  if (parentId) {
    const parent = figma.getNodeById(parentId);
    if (parent && "appendChild" in parent) {
      (parent as FrameNode).appendChild(node);
      return;
    }
  }
  figma.currentPage.appendChild(node);
}

function fontStyleFromWeight(weight?: number): string {
  if (!weight) return "Regular";
  if (weight <= 100) return "Thin";
  if (weight <= 200) return "ExtraLight";
  if (weight <= 300) return "Light";
  if (weight <= 400) return "Regular";
  if (weight <= 500) return "Medium";
  if (weight <= 600) return "SemiBold";
  if (weight <= 700) return "Bold";
  if (weight <= 800) return "ExtraBold";
  return "Black";
}

// --- Command Handler ---

async function handleCommand(
  command: string,
  params: Record<string, unknown>
): Promise<unknown> {
  switch (command) {
    // ===== Document =====

    case "get_document_info":
      return {
        name: figma.root.name,
        pages: figma.root.children.map((p) => ({
          id: p.id,
          name: p.name,
          childCount: p.children.length,
        })),
      };

    case "list_pages":
      return figma.root.children.map((p) => ({
        id: p.id,
        name: p.name,
        childCount: p.children.length,
      }));

    case "create_page": {
      const page = figma.createPage();
      page.name = params.name as string;
      return { id: page.id, name: page.name };
    }

    case "delete_page": {
      const page = figma.getNodeById(params.pageId as string);
      if (!page || page.type !== "PAGE") {
        throw new Error("NODE_NOT_FOUND: Page not found");
      }
      if (figma.root.children.length <= 1) {
        throw new Error("INVALID_OPERATION: Cannot delete the last page");
      }
      page.remove();
      return { success: true };
    }

    case "set_current_page": {
      const page = figma.getNodeById(params.pageId as string);
      if (!page || page.type !== "PAGE") {
        throw new Error("NODE_NOT_FOUND: Page not found");
      }
      figma.currentPage = page;
      return { id: page.id, name: page.name };
    }

    // ===== Read =====

    case "get_selection":
      return figma.currentPage.selection.map(serializeNode);

    case "get_node_info": {
      const node = getNodeOrThrow(params.nodeId as string);
      return serializeNode(node);
    }

    case "get_nodes_by_type": {
      const parent = params.parentId
        ? getNodeOrThrow(params.parentId as string)
        : figma.currentPage;
      const nodeType = params.nodeType as string;
      const results: Record<string, unknown>[] = [];
      const searchIn = "findAll" in parent ? parent : figma.currentPage;

      (searchIn as FrameNode).findAll((n) => {
        if (results.length >= 100) return false;
        if (n.type === nodeType) {
          results.push({ id: n.id, name: n.name, type: n.type });
        }
        return false;
      });
      return results;
    }

    case "find_nodes_by_name": {
      const searchName = (params.name as string).toLowerCase();
      const parent = params.parentId
        ? getNodeOrThrow(params.parentId as string)
        : figma.currentPage;
      const results: Record<string, unknown>[] = [];
      const searchIn = "findAll" in parent ? parent : figma.currentPage;

      (searchIn as FrameNode).findAll((n) => {
        if (results.length >= 100) return false;
        if (n.name.toLowerCase().includes(searchName)) {
          results.push({ id: n.id, name: n.name, type: n.type });
        }
        return false;
      });
      return results;
    }

    // ===== Create =====

    case "create_frame": {
      const frame = figma.createFrame();
      if (params.name) frame.name = params.name as string;
      frame.x = (params.x as number) ?? 0;
      frame.y = (params.y as number) ?? 0;
      frame.resize((params.width as number) ?? 100, (params.height as number) ?? 100);
      appendToParent(frame, params.parentId as string | undefined);
      return { id: frame.id, name: frame.name };
    }

    case "create_rectangle": {
      const rect = figma.createRectangle();
      if (params.name) rect.name = params.name as string;
      rect.x = (params.x as number) ?? 0;
      rect.y = (params.y as number) ?? 0;
      rect.resize((params.width as number) ?? 100, (params.height as number) ?? 100);
      if (params.fills) {
        rect.fills = parseFills(
          params.fills as Array<{ type: string; color: string; opacity?: number }>
        );
      }
      appendToParent(rect, params.parentId as string | undefined);
      return { id: rect.id, name: rect.name };
    }

    case "create_ellipse": {
      const ellipse = figma.createEllipse();
      if (params.name) ellipse.name = params.name as string;
      ellipse.x = (params.x as number) ?? 0;
      ellipse.y = (params.y as number) ?? 0;
      ellipse.resize((params.width as number) ?? 100, (params.height as number) ?? 100);
      if (params.fills) {
        ellipse.fills = parseFills(
          params.fills as Array<{ type: string; color: string; opacity?: number }>
        );
      }
      appendToParent(ellipse, params.parentId as string | undefined);
      return { id: ellipse.id, name: ellipse.name };
    }

    case "create_text": {
      const text = figma.createText();
      const family = (params.fontFamily as string) || "Inter";
      const style = "Regular";
      await figma.loadFontAsync({ family, style });
      text.characters = params.text as string;
      text.fontSize = (params.fontSize as number) || 14;
      if (params.name) text.name = params.name as string;
      text.x = (params.x as number) ?? 0;
      text.y = (params.y as number) ?? 0;
      if (params.fills) {
        text.fills = parseFills(
          params.fills as Array<{ type: string; color: string; opacity?: number }>
        );
      }
      appendToParent(text, params.parentId as string | undefined);
      return { id: text.id, name: text.name };
    }

    case "create_component": {
      const comp = figma.createComponent();
      if (params.name) comp.name = params.name as string;
      comp.x = (params.x as number) ?? 0;
      comp.y = (params.y as number) ?? 0;
      comp.resize((params.width as number) ?? 100, (params.height as number) ?? 100);
      appendToParent(comp, params.parentId as string | undefined);
      return { id: comp.id, name: comp.name };
    }

    case "create_section": {
      const section = figma.createSection();
      section.name = params.name as string;
      section.x = (params.x as number) ?? 0;
      section.y = (params.y as number) ?? 0;
      section.resizeWithoutConstraints(
        (params.width as number) ?? 500,
        (params.height as number) ?? 500
      );
      return { id: section.id, name: section.name };
    }

    // ===== Update =====

    case "move_node": {
      const node = getNodeOrThrow(params.nodeId as string);
      node.x = params.x as number;
      node.y = params.y as number;
      return { id: node.id, x: node.x, y: node.y };
    }

    case "resize_node": {
      const node = getNodeOrThrow(params.nodeId as string);
      if ("resize" in node) {
        (node as FrameNode).resize(params.width as number, params.height as number);
      }
      return {
        id: node.id,
        width: "width" in node ? node.width : undefined,
        height: "height" in node ? node.height : undefined,
      };
    }

    case "rename_node": {
      const node = getNodeOrThrow(params.nodeId as string);
      node.name = params.name as string;
      return { id: node.id, name: node.name };
    }

    case "set_opacity": {
      const node = getNodeOrThrow(params.nodeId as string);
      if ("opacity" in node) {
        (node as FrameNode).opacity = params.opacity as number;
      }
      return {
        id: node.id,
        opacity: "opacity" in node ? node.opacity : undefined,
      };
    }

    case "set_corner_radius": {
      const node = getNodeOrThrow(params.nodeId as string);
      if ("cornerRadius" in node) {
        const n = node as RectangleNode;
        if (
          params.topLeft !== undefined ||
          params.topRight !== undefined ||
          params.bottomLeft !== undefined ||
          params.bottomRight !== undefined
        ) {
          n.topLeftRadius = (params.topLeft as number) ?? 0;
          n.topRightRadius = (params.topRight as number) ?? 0;
          n.bottomLeftRadius = (params.bottomLeft as number) ?? 0;
          n.bottomRightRadius = (params.bottomRight as number) ?? 0;
        } else if (params.radius !== undefined) {
          n.cornerRadius = params.radius as number;
        }
      }
      return {
        id: node.id,
        cornerRadius: "cornerRadius" in node ? node.cornerRadius : undefined,
      };
    }

    // ===== Styling =====

    case "set_fills": {
      const node = getNodeOrThrow(params.nodeId as string);
      if ("fills" in node) {
        (node as GeometryMixin & SceneNode).fills = parseFills(
          params.fills as Array<{ type: string; color: string; opacity?: number }>
        );
      }
      return { id: node.id, fills: "fills" in node ? node.fills : undefined };
    }

    case "set_strokes": {
      const node = getNodeOrThrow(params.nodeId as string);
      if ("strokes" in node) {
        (node as GeometryMixin & SceneNode).strokes = parseFills(
          params.strokes as Array<{ type: string; color: string; opacity?: number }>
        );
        if (params.strokeWeight !== undefined && "strokeWeight" in node) {
          (node as GeometryMixin & SceneNode).strokeWeight =
            params.strokeWeight as number;
        }
      }
      return {
        id: node.id,
        strokes: "strokes" in node ? node.strokes : undefined,
      };
    }

    case "set_effects": {
      const node = getNodeOrThrow(params.nodeId as string);
      if ("effects" in node) {
        const effects = (
          params.effects as Array<{
            type: string;
            color?: string;
            offset?: { x: number; y: number };
            radius: number;
            visible?: boolean;
          }>
        ).map((e) => {
          if (
            (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") &&
            e.color
          ) {
            const rgb = hexToRgb(e.color);
            return {
              type: e.type,
              color: { ...rgb, a: 1 },
              offset: e.offset ?? { x: 0, y: 4 },
              radius: e.radius,
              spread: 0,
              visible: e.visible ?? true,
              blendMode: "NORMAL",
            } as DropShadowEffect;
          }

          return {
            type: e.type,
            radius: e.radius,
            visible: e.visible ?? true,
          } as Effect;
        });

        (node as BlendMixin & SceneNode).effects = effects;
      }
      return {
        id: node.id,
        effects: "effects" in node ? node.effects : undefined,
      };
    }

    case "set_text": {
      const node = getNodeOrThrow(params.nodeId as string);
      if (node.type !== "TEXT") {
        throw new Error("INVALID_NODE_TYPE: Node is not a text node");
      }
      const family = (params.fontFamily as string) || "Inter";
      const style = fontStyleFromWeight(params.fontWeight as number | undefined);
      await figma.loadFontAsync({ family, style });
      node.characters = params.text as string;
      if (params.fontSize !== undefined) {
        node.fontSize = params.fontSize as number;
      }
      return { id: node.id, characters: node.characters };
    }

    // ===== Layout =====

    case "set_layout_mode": {
      const node = getNodeOrThrow(params.nodeId as string);
      if (node.type !== "FRAME" && node.type !== "COMPONENT") {
        throw new Error(
          "INVALID_NODE_TYPE: Auto-layout can only be set on frames or components"
        );
      }
      const frame = node as FrameNode;
      frame.layoutMode = params.mode as "NONE" | "HORIZONTAL" | "VERTICAL";
      if (params.spacing !== undefined)
        frame.itemSpacing = params.spacing as number;
      if (params.paddingTop !== undefined)
        frame.paddingTop = params.paddingTop as number;
      if (params.paddingRight !== undefined)
        frame.paddingRight = params.paddingRight as number;
      if (params.paddingBottom !== undefined)
        frame.paddingBottom = params.paddingBottom as number;
      if (params.paddingLeft !== undefined)
        frame.paddingLeft = params.paddingLeft as number;
      if (params.primaryAxisAlignItems !== undefined)
        frame.primaryAxisAlignItems = params.primaryAxisAlignItems as
          | "MIN"
          | "CENTER"
          | "MAX"
          | "SPACE_BETWEEN";
      if (params.counterAxisAlignItems !== undefined)
        frame.counterAxisAlignItems = params.counterAxisAlignItems as
          | "MIN"
          | "CENTER"
          | "MAX";
      return { id: frame.id, layoutMode: frame.layoutMode };
    }

    // ===== Delete =====

    case "delete_node": {
      const node = getNodeOrThrow(params.nodeId as string);
      node.remove();
      return { success: true };
    }

    case "delete_nodes": {
      const nodeIds = params.nodeIds as string[];
      const deleted: string[] = [];
      const failed: string[] = [];
      for (const nid of nodeIds) {
        try {
          const node = getNodeOrThrow(nid);
          node.remove();
          deleted.push(nid);
        } catch {
          failed.push(nid);
        }
      }
      return { deleted, failed };
    }

    // ===== Variables =====

    case "get_local_variables": {
      const variables = await figma.variables.getLocalVariablesAsync();
      let filtered = variables;
      if (params.collectionId) {
        filtered = variables.filter(
          (v) => v.variableCollectionId === params.collectionId
        );
      }
      return filtered.map((v) => ({
        id: v.id,
        name: v.name,
        resolvedType: v.resolvedType,
        variableCollectionId: v.variableCollectionId,
        valuesByMode: v.valuesByMode,
      }));
    }

    case "get_variable_collections": {
      const collections =
        await figma.variables.getLocalVariableCollectionsAsync();
      return collections.map((c) => ({
        id: c.id,
        name: c.name,
        modes: c.modes,
        variableIds: c.variableIds,
      }));
    }

    case "create_variable_collection": {
      const collection = figma.variables.createVariableCollection(
        params.name as string
      );
      if (params.modes) {
        const modes = params.modes as string[];
        if (modes.length > 0) {
          collection.renameMode(collection.modes[0].modeId, modes[0]);
        }
        for (let i = 1; i < modes.length; i++) {
          collection.addMode(modes[i]);
        }
      }
      return { id: collection.id, name: collection.name, modes: collection.modes };
    }

    case "create_variable": {
      const variable = figma.variables.createVariable(
        params.name as string,
        params.collectionId as string,
        params.resolvedType as VariableResolvedDataType
      );
      if (params.value !== undefined) {
        const collection = figma.variables.getVariableCollectionById(
          params.collectionId as string
        );
        if (collection) {
          const defaultModeId = collection.modes[0].modeId;
          let val = params.value;
          if (params.resolvedType === "COLOR" && typeof val === "string") {
            val = hexToRgb(val as string);
          }
          variable.setValueForMode(defaultModeId, val as VariableValue);
        }
      }
      return { id: variable.id, name: variable.name };
    }

    case "update_variable": {
      const variable = figma.variables.getVariableById(
        params.variableId as string
      );
      if (!variable) throw new Error("NODE_NOT_FOUND: Variable not found");
      let val = params.value;
      if (variable.resolvedType === "COLOR" && typeof val === "string") {
        val = hexToRgb(val as string);
      }
      variable.setValueForMode(
        params.modeId as string,
        val as VariableValue
      );
      return { id: variable.id, name: variable.name };
    }

    case "delete_variable": {
      const variable = figma.variables.getVariableById(
        params.variableId as string
      );
      if (!variable) throw new Error("NODE_NOT_FOUND: Variable not found");
      variable.remove();
      return { success: true };
    }

    case "get_styles": {
      const paintStyles = await figma.getLocalPaintStylesAsync();
      const textStyles = await figma.getLocalTextStylesAsync();
      const effectStyles = await figma.getLocalEffectStylesAsync();
      const gridStyles = await figma.getLocalGridStylesAsync();

      return [
        ...paintStyles.map((s) => ({
          id: s.id,
          name: s.name,
          type: "PAINT",
          description: s.description,
        })),
        ...textStyles.map((s) => ({
          id: s.id,
          name: s.name,
          type: "TEXT",
          description: s.description,
        })),
        ...effectStyles.map((s) => ({
          id: s.id,
          name: s.name,
          type: "EFFECT",
          description: s.description,
        })),
        ...gridStyles.map((s) => ({
          id: s.id,
          name: s.name,
          type: "GRID",
          description: s.description,
        })),
      ];
    }

    default:
      throw new Error(`UNKNOWN_COMMAND: "${command}" is not a recognized command`);
  }
}

// --- Message Handler ---

figma.ui.onmessage = async (msg: {
  type: string;
  id: string;
  command: string;
  params: Record<string, unknown>;
}) => {
  if (msg.type !== "execute-command") return;

  try {
    const result = await handleCommand(msg.command, msg.params);
    figma.ui.postMessage({
      type: "command-result",
      id: msg.id,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const code = message.includes(":") ? message.split(":")[0] : "PLUGIN_ERROR";
    figma.ui.postMessage({
      type: "command-error",
      id: msg.id,
      error: { code, message },
    });
  }
};
